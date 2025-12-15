import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const starlinkUseCasesQuery = groq`
  _type == "starlink-use-cases" => {
    _type,
    _key,
    padding,
    colorVariant,
    title,
  }
`;
