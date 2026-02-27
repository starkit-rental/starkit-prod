/**
 * Booqable → Starkit Pricing Tiers Export Script
 * ==============================================
 * Exports pricing tiers from all products in Booqable.
 * 
 * HOW TO USE:
 *  1. Log in to starkit-rental.booqable.com
 *  2. Open any page (e.g. /products)
 *  3. Open DevTools → Console (F12)
 *  4. Paste this script and press Enter
 *  5. File "booqable-pricing-tiers-YYYY-MM-DD.json" downloads automatically
 */

(async function () {
  "use strict";

  // ── Config ──────────────────────────────────────────────────────────────────
  const PER_PAGE = 100;
  const DELAY_MS = 300;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ── Find working Booqable API base ──────────────────────────────────────────
  async function detectApiBase() {
    const candidates = [
      "/api/boomerang",
      "/api/4",
      "/api/3",
    ];
    for (const path of candidates) {
      try {
        const r = await fetch(`${path}/products?page[size]=1`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (r.ok) {
          console.log("✅ API base:", path);
          return path;
        }
        console.log(`  ${r.status} → ${path}`);
      } catch (e) {
        console.log(`  Error → ${path}:`, e.message);
      }
    }
    return null;
  }

  function normalizeTier(obj) {
    const attrs = obj?.attributes || obj || {};
    const dayValue =
      Number(attrs.duration_days ?? attrs.days ?? attrs.duration ?? attrs.period ?? 0) || 0;
    const multiplierValue =
      Number(
        attrs.price_multiplier ??
          attrs.multiplier ??
          attrs.amount ??
          attrs.price ??
          attrs.value ??
          0
      ) || 0;
    const labelValue =
      attrs.name ||
      attrs.label ||
      (dayValue ? `${dayValue} days` : "Custom tier");

    return {
      days: dayValue,
      multiplier: multiplierValue,
      label: labelValue,
    };
  }

  async function fetchPriceTiersForGroup(apiBase, priceGroupId) {
    const tiers = [];
    if (!priceGroupId) return tiers;

    const PAGE = 100;
    let page = 1;

    while (true) {
      const url =
        `${apiBase}/price_tiers?page[size]=${PAGE}&page[number]=${page}` +
        `&filter[price_group_id]=${encodeURIComponent(priceGroupId)}`;

      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        console.warn(`    ⚠️  price_tiers fetch failed (${res.status}) for group ${priceGroupId}`);
        break;
      }

      const json = await res.json();
      const tierData = json.data || json.price_tiers || json.tiers || [];

      tiers.push(...tierData.map(normalizeTier));

      if (tierData.length < PAGE) break;
      page++;
    }

    return tiers;
  }

  async function fetchPriceTiersForProduct(apiBase, productId) {
    const tiers = [];
    if (!productId) return tiers;

    const PAGE = 100;
    let page = 1;

    while (true) {
      const url =
        `${apiBase}/price_tiers?page[size]=${PAGE}&page[number]=${page}` +
        `&filter[product_id]=${encodeURIComponent(productId)}`;

      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        break;
      }

      const json = await res.json();
      const tierData = json.data || json.price_tiers || json.tiers || [];

      tiers.push(...tierData.map(normalizeTier));

      if (tierData.length < PAGE) break;
      page++;
    }

    return tiers;
  }

  async function resolveAutoIncrement(apiBase, priceGroup) {
    const attrs = priceGroup?.attributes || priceGroup || {};
    const autoField =
      attrs.automatic_increment_multiplier ??
      attrs.auto_increment_multiplier ??
      attrs.auto_increment_value ??
      attrs.increment_multiplier ??
      null;
    if (autoField !== null && autoField !== undefined) return Number(autoField) || null;

    if (!priceGroup?.id) return null;

    try {
      const res = await fetch(`${apiBase}/automatic_increments/${priceGroup.id}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const json = await res.json();
      const attrsAi = json.data?.attributes || json || {};
      return Number(attrsAi.multiplier ?? attrsAi.amount ?? attrsAi.value ?? 0) || null;
    } catch {
      return null;
    }
  }

  const priceStructureCache = new Map();

  async function fetchPriceStructure(apiBase, structureId) {
    if (!structureId) return null;
    if (priceStructureCache.has(structureId)) {
      return priceStructureCache.get(structureId);
    }

    try {
      const res = await fetch(
        `${apiBase}/price_structures/${structureId}?include=price_tiers`,
        {
          credentials: "include",
          headers: { Accept: "application/json" },
        }
      );

      if (!res.ok) {
        console.warn(`    ⚠️  price_structure fetch failed (${res.status}) for id ${structureId}`);
        priceStructureCache.set(structureId, null);
        return null;
      }

      const json = await res.json();
      const structure = json.data || json.price_structure || null;
      const included = json.included || [];

      if (!structure) {
        priceStructureCache.set(structureId, null);
        return null;
      }

      const tierMap = {};
      included.forEach((inc) => {
        if (inc.type === "price_tiers" || inc.type === "price_tier") {
          tierMap[inc.id] = inc;
        }
      });

      const tiers = [];
      const tierRels = structure.relationships?.price_tiers?.data || [];
      tierRels.forEach((rel) => {
        const tierObj = tierMap[rel.id];
        if (tierObj) tiers.push(normalizeTier(tierObj));
      });
      tiers.sort((a, b) => a.days - b.days);

      const result = {
        id: structure.id,
        name: structure.attributes?.name || structure.attributes?.template_name || "",
        tiers,
      };
      priceStructureCache.set(structureId, result);
      return result;
    } catch (e) {
      console.warn(`    ⚠️  price_structure fetch error for id ${structureId}:`, e);
      priceStructureCache.set(structureId, null);
      return null;
    }
  }

  // ── Fetch all products ─────────────────────────────────────────────────────
  async function fetchAllProducts(apiBase) {
    const all = [];
    let page = 1;
    let total = null;

    while (true) {
      const url = `${apiBase}/products?page[number]=${page}&page[size]=${PER_PAGE}` +
        `&include=price_groups,price_tiers,price_structure,price_structure.price_tiers`;
      
      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        console.error(`API error ${res.status} on page ${page}`);
        break;
      }

      const json = await res.json();
      const products = json.data || json.products || [];
      const included = json.included || [];

      if (products.length === 0) break;

      // Build lookup maps for included data
      const priceGroupMap = {};
      const priceTierMap = {};
      const priceStructureMap = {};
      
      for (const inc of included) {
        if (inc.type === "price_groups" || inc.type === "price_group") {
          priceGroupMap[inc.id] = inc;
        } else if (inc.type === "price_tiers" || inc.type === "price_tier") {
          priceTierMap[inc.id] = inc;
        } else if (inc.type === "price_structures" || inc.type === "price_structure") {
          priceStructureMap[inc.id] = inc;
        }
      }

      for (const p of products) {
        const attrs = p.attributes || p;
        const relationships = p.relationships || {};

        // Determine base price
        const basePriceCandidates = [
          attrs.base_price,
          attrs.base_price_day,
          attrs.base_price_amount,
          attrs.price,
          attrs.rate,
          attrs.daily_price,
          attrs.default_price,
          attrs.base_price_cents ? (attrs.base_price_cents / 100) : undefined,
          attrs.price_in_cents ? (attrs.price_in_cents / 100) : undefined,
        ];
        const basePrice = Number(basePriceCandidates.find((v) => v !== undefined && v !== null)) || 0;

        // Extract price tiers from relationships, price groups, templates or fallback API
        const priceTiers = [];
        const tierIds = new Set();

        const directTierRels = relationships.price_tiers?.data || relationships.price_tier?.data || [];
        directTierRels.forEach((rel) => rel?.id && tierIds.add(rel.id));

        const priceGroupRels =
          relationships.price_groups?.data ||
          relationships.price_group?.data ||
          [];
        const groupIds = Array.isArray(priceGroupRels)
          ? priceGroupRels.map((g) => g?.id).filter(Boolean)
          : priceGroupRels?.id
            ? [priceGroupRels.id]
            : [];

        for (const groupId of groupIds) {
          const group = priceGroupMap[groupId];
          const groupTierRels = group?.relationships?.price_tiers?.data || [];
          groupTierRels.forEach((rel) => rel?.id && tierIds.add(rel.id));
        }

        if (tierIds.size > 0) {
          tierIds.forEach((id) => {
            const tierObj = priceTierMap[id];
            if (tierObj) priceTiers.push(normalizeTier(tierObj));
          });
        }

        // Fallback fetch if nothing found yet
        if (priceTiers.length === 0) {
          if (groupIds.length > 0) {
            for (const groupId of groupIds) {
              const groupTiers = await fetchPriceTiersForGroup(apiBase, groupId);
              if (groupTiers.length) {
                priceTiers.push(...groupTiers);
              }
            }
          }

          if (priceTiers.length === 0) {
            const productTiers = await fetchPriceTiersForProduct(apiBase, p.id);
            if (productTiers.length) priceTiers.push(...productTiers);
          }

          if (priceTiers.length === 0) {
            const structureRel = relationships.price_structure?.data;
            const structureId =
              structureRel?.id ||
              attrs.price_structure_id ||
              attrs.price_structure_template_id ||
              null;
            if (structureId) {
              const inlineStructure = priceStructureMap[structureId];
              if (inlineStructure?.relationships?.price_tiers?.data?.length) {
                inlineStructure.relationships.price_tiers.data.forEach((rel) => {
                  const tierObj = priceTierMap[rel.id];
                  if (tierObj) priceTiers.push(normalizeTier(tierObj));
                });
                attrs.__price_structure_name = inlineStructure.attributes?.name || attrs.__price_structure_name;
              }

              if (priceTiers.length === 0) {
                const structure = await fetchPriceStructure(apiBase, structureId);
                if (structure?.tiers?.length) {
                  priceTiers.push(...structure.tiers);
                  attrs.__price_structure_name = structure.name;
                }
              }
            }
          }
        }

        priceTiers.sort((a, b) => a.days - b.days);

        let autoIncrement = null;
        if (groupIds.length > 0) {
          autoIncrement = await resolveAutoIncrement(apiBase, priceGroupMap[groupIds[0]]);
        }

        all.push({
          product_id: p.id,
          product_name: attrs.name || "Unnamed Product",
          base_price: basePrice,
          price_tiers: priceTiers,
          auto_increment_multiplier: autoIncrement,
          price_structure_name: attrs.__price_structure_name || null,
        });
      }

      // Detect total from meta
      if (total === null) {
        total = json.meta?.total_count || json.meta?.count || null;
        if (total) console.log(`📦 Total products to fetch: ${total}`);
      }

      console.log(`  Page ${page}: +${products.length} products (${all.length}${total ? "/" + total : ""})`);

      if (total && all.length >= Number(total)) break;
      if (products.length < PER_PAGE) break;

      page++;
      await sleep(DELAY_MS);
    }

    return all;
  }

  // ── Download helper ──────────────────────────────────────────────────────────
  function downloadJson(data) {
    const payload = {
      exported_at: new Date().toISOString(),
      source: "booqable",
      total: data.length,
      products: data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booqable-pricing-tiers-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  console.log("🚀 Booqable pricing tiers export starting…");

  const apiBase = await detectApiBase();
  if (!apiBase) {
    console.error("❌ Could not find Booqable API. Make sure you are logged in at starkit-rental.booqable.com");
    return;
  }

  const products = await fetchAllProducts(apiBase);

  if (products.length === 0) {
    console.error("❌ No products returned. Check API response above.");
    return;
  }

  // Show summary
  console.log(`\n📊 Export Summary:`);
  console.log(`   Products: ${products.length}`);
  let totalTiers = 0;
  products.forEach(p => {
    totalTiers += p.price_tiers.length;
    if (p.price_tiers.length > 0) {
      console.log(`   - ${p.product_name}: ${p.price_tiers.length} tiers`);
    }
  });
  console.log(`   Total tiers: ${totalTiers}`);

  downloadJson(products);
  console.log(`✅ Done! Exported pricing tiers for ${products.length} products.`);
})();
