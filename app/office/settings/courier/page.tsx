"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Truck, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { DEFAULT_SENDER_CONFIG, COURIER_SETTINGS_KEYS } from "@/lib/courier/base-courier-config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CourierSettingsPage() {
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: DEFAULT_SENDER_CONFIG.firstName,
    lastName: DEFAULT_SENDER_CONFIG.lastName,
    phoneNumber: DEFAULT_SENDER_CONFIG.phoneNumber,
    email: DEFAULT_SENDER_CONFIG.email,
    street: DEFAULT_SENDER_CONFIG.street,
    buildingNumber: DEFAULT_SENDER_CONFIG.buildingNumber,
    flatNumber: DEFAULT_SENDER_CONFIG.flatNumber,
    postCode: DEFAULT_SENDER_CONFIG.postCode,
    city: DEFAULT_SENDER_CONFIG.city,
    postingCode: DEFAULT_SENDER_CONFIG.postingCode,
    // GlobKurier credentials
    globkurierEmail: '',
    globkurierPassword: '',
    globkurierEnvironment: 'test' as 'test' | 'production',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [originalData, setOriginalData] = useState(formData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError(null);

    const allKeys = [
      ...Object.values(COURIER_SETTINGS_KEYS),
      'globkurier_email',
      'globkurier_password',
      'globkurier_environment',
    ];

    const { data, error: fetchError } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", allKeys);

    if (fetchError) {
      setError("Nie udało się załadować ustawień: " + fetchError.message);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const settingsMap = new Map(data.map((s) => [s.key, s.value]));
      
      const loadedData = {
        firstName: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_FIRST_NAME) || DEFAULT_SENDER_CONFIG.firstName,
        lastName: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_LAST_NAME) || DEFAULT_SENDER_CONFIG.lastName,
        phoneNumber: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_PHONE) || DEFAULT_SENDER_CONFIG.phoneNumber,
        email: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_EMAIL) || DEFAULT_SENDER_CONFIG.email,
        street: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_STREET) || DEFAULT_SENDER_CONFIG.street,
        buildingNumber: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_BUILDING) || DEFAULT_SENDER_CONFIG.buildingNumber,
        flatNumber: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_FLAT) || DEFAULT_SENDER_CONFIG.flatNumber,
        postCode: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_POST_CODE) || DEFAULT_SENDER_CONFIG.postCode,
        city: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_CITY) || DEFAULT_SENDER_CONFIG.city,
        postingCode: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_POSTING_CODE) || DEFAULT_SENDER_CONFIG.postingCode,
        globkurierEmail: settingsMap.get('globkurier_email') || '',
        globkurierPassword: settingsMap.get('globkurier_password') || '',
        globkurierEnvironment: (settingsMap.get('globkurier_environment') || 'test') as 'test' | 'production',
      };

      setFormData(loadedData);
      setOriginalData(loadedData);
    }

    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const updates = [
      { key: COURIER_SETTINGS_KEYS.SENDER_FIRST_NAME, value: formData.firstName },
      { key: COURIER_SETTINGS_KEYS.SENDER_LAST_NAME, value: formData.lastName },
      { key: COURIER_SETTINGS_KEYS.SENDER_PHONE, value: formData.phoneNumber },
      { key: COURIER_SETTINGS_KEYS.SENDER_EMAIL, value: formData.email },
      { key: COURIER_SETTINGS_KEYS.SENDER_STREET, value: formData.street },
      { key: COURIER_SETTINGS_KEYS.SENDER_BUILDING, value: formData.buildingNumber },
      { key: COURIER_SETTINGS_KEYS.SENDER_FLAT, value: formData.flatNumber },
      { key: COURIER_SETTINGS_KEYS.SENDER_POST_CODE, value: formData.postCode },
      { key: COURIER_SETTINGS_KEYS.SENDER_CITY, value: formData.city },
      { key: COURIER_SETTINGS_KEYS.SENDER_POSTING_CODE, value: formData.postingCode },
      { key: 'globkurier_email', value: formData.globkurierEmail },
      { key: 'globkurier_password', value: formData.globkurierPassword },
      { key: 'globkurier_environment', value: formData.globkurierEnvironment },
    ];

    try {
      for (const update of updates) {
        const { error: upsertError } = await supabase
          .from("site_settings")
          .upsert(
            { key: update.key, value: update.value, updated_at: new Date().toISOString() },
            { onConflict: "key" }
          );

        if (upsertError) {
          throw upsertError;
        }
      }

      setOriginalData(formData);
      setSuccess("Ustawienia zostały zapisane pomyślnie");
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Nie udało się zapisać ustawień: " + (err instanceof Error ? err.message : "Nieznany błąd"));
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Ustawienia kuriera
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Konfiguracja danych nadawcy i integracji GlobKurier
          </p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={!hasChanges || saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Zapisz zmiany
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-900">
          {success}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
        <Card>
          <CardHeader>
            <CardTitle>Dane nadawcy</CardTitle>
            <CardDescription>
              Te dane będą używane jako nadawca w przesyłkach wysyłkowych i odbiorca w przesyłkach zwrotnych
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Imię</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange("firstName")}
                  placeholder="Maciej"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nazwisko</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange("lastName")}
                  placeholder="Godek"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Telefon</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange("phoneNumber")}
                  placeholder="795097658"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange("email")}
                  placeholder="starkit.rental@gmail.com"
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="street">Ulica</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={handleChange("street")}
                  placeholder="Cumownicza"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buildingNumber">Nr budynku</Label>
                <Input
                  id="buildingNumber"
                  value={formData.buildingNumber}
                  onChange={handleChange("buildingNumber")}
                  placeholder="1a"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flatNumber">Nr mieszkania</Label>
                <Input
                  id="flatNumber"
                  value={formData.flatNumber}
                  onChange={handleChange("flatNumber")}
                  placeholder="2"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postCode">Kod pocztowy</Label>
                <Input
                  id="postCode"
                  value={formData.postCode}
                  onChange={handleChange("postCode")}
                  placeholder="60-480"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Miasto</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={handleChange("city")}
                  placeholder="Poznań"
                />
              </div>
            </div>

            {/* InPost Point */}
            <div className="space-y-2">
              <Label htmlFor="postingCode">Paczkomat InPost (punkt nadania)</Label>
              <Input
                id="postingCode"
                value={formData.postingCode}
                onChange={handleChange("postingCode")}
                placeholder="POZ118M"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                ID paczkomatu, z którego będą nadawane przesyłki
              </p>
            </div>
          </CardContent>
        </Card>

        {/* GlobKurier API Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Integracja GlobKurier</CardTitle>
            <CardDescription>
              Dane logowania do API GlobKurier. Wymagane do tworzenia przesyłek.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="globkurierEmail">Email (login)</Label>
                <Input
                  id="globkurierEmail"
                  type="email"
                  value={formData.globkurierEmail}
                  onChange={handleChange("globkurierEmail")}
                  placeholder="twoj@email.pl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="globkurierPassword">Hasło</Label>
                <div className="relative">
                  <Input
                    id="globkurierPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.globkurierPassword}
                    onChange={handleChange("globkurierPassword")}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="globkurierEnvironment">Środowisko</Label>
              <Select
                value={formData.globkurierEnvironment}
                onValueChange={(value: 'test' | 'production') => 
                  setFormData(prev => ({ ...prev, globkurierEnvironment: value }))
                }
              >
                <SelectTrigger id="globkurierEnvironment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Testowe (sandbox)</SelectItem>
                  <SelectItem value="production">Produkcyjne</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Użyj środowiska testowego do sprawdzenia integracji
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!formData.globkurierEmail || !formData.globkurierPassword) {
                    setError('Wprowadź email i hasło');
                    return;
                  }
                  setTestingConnection(true);
                  setConnectionStatus('idle');
                  try {
                    const res = await fetch('/api/courier/globkurier/test-connection', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: formData.globkurierEmail,
                        password: formData.globkurierPassword,
                        environment: formData.globkurierEnvironment,
                      }),
                    });
                    if (res.ok) {
                      setConnectionStatus('success');
                    } else {
                      setConnectionStatus('error');
                    }
                  } catch {
                    setConnectionStatus('error');
                  } finally {
                    setTestingConnection(false);
                  }
                }}
                disabled={testingConnection || !formData.globkurierEmail || !formData.globkurierPassword}
              >
                {testingConnection ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testowanie...</>
                ) : (
                  'Test połączenia'
                )}
              </Button>
              {connectionStatus === 'success' && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> Połączenie OK
                </span>
              )}
              {connectionStatus === 'error' && (
                <span className="flex items-center gap-1 text-sm text-red-600">
                  <XCircle className="h-4 w-4" /> Błąd połączenia
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}
