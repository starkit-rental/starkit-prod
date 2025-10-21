import { groq } from "next-sanity";
import { bodyQuery } from "../shared/body";

// @sanity-typegen-ignore
export const richBodyQuery = groq`
  _type == "rich-body" => {
    _type,
    _key,
    align,
    body[]{
      ${bodyQuery}
    },
  }
`;
