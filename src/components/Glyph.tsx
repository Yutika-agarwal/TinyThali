import { BOOST_ICON, ICON_SVG, INGREDIENT_ICON } from "../data/icons.ts";

/**
 * Picture for a boost or ingredient: our own illustration when one exists (so sesame never
 * shows up as a bean), otherwise the emoji.
 */
export default function Glyph({
  kind,
  id,
  emoji,
  size = "1.3em",
}: {
  kind: "boost" | "ing";
  id: string;
  emoji: string;
  size?: string;
}) {
  const icon = (kind === "boost" ? BOOST_ICON : INGREDIENT_ICON)[id];
  const svg = icon ? ICON_SVG[icon] : undefined;
  if (!svg) return <span aria-hidden>{emoji}</span>;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden
      className="inline-block shrink-0 align-[-0.25em]"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
