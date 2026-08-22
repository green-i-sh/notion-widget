/**
 * Runtime check for resolveOriginalImageUrl (see kakao.ts's own doc comment
 * for why this exists). Not a framework test — run directly with node after
 * compiling, same pattern as routeDispatch.test.ts.
 */
import assert from "node:assert/strict";
import { resolveOriginalImageUrl, pickIsbn13, formatPublished } from "./kakao.js";

function main() {
  {
    const thumbnail =
      "https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F7257107%3Ftimestamp%3D20260711144829";
    const result = resolveOriginalImageUrl(thumbnail);
    assert.equal(result, "https://t1.daumcdn.net/lbook/image/7257107?timestamp=20260711144829");
    console.log("PASS  fname present, http:// original -> upgraded to https ->", result);
  }

  {
    const thumbnail = "https://search1.kakaocdn.net/thumb/R120x174.q85/?other=foo";
    const result = resolveOriginalImageUrl(thumbnail);
    assert.equal(result, thumbnail);
    console.log("PASS  no fname -> original thumbnail unchanged ->", result);
  }

  {
    const result = resolveOriginalImageUrl("not a url");
    assert.equal(result, "", `expected empty string for an unparseable URL, got: ${JSON.stringify(result)}`);
    console.log("PASS  unparseable thumbnail -> empty string, no throw ->", JSON.stringify(result));
  }

  {
    // fname present but its decoded value is itself http, not upgradeable to
    // something Notion would accept as-is if it somehow stayed non-https —
    // guards the final https-only gate independent of the fname branch.
    const thumbnail = "https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=" + encodeURIComponent("ftp://example.com/cover.jpg");
    const result = resolveOriginalImageUrl(thumbnail);
    assert.equal(result, "", `expected empty string for a non-http(s) original, got: ${JSON.stringify(result)}`);
    console.log("PASS  non-http(s) original -> empty string ->", JSON.stringify(result));
  }

  {
    assert.equal(pickIsbn13("8983920775 9788983920777"), "9788983920777");
    assert.equal(pickIsbn13("9788983920777"), "9788983920777");
    assert.equal(pickIsbn13(""), "");
    console.log("PASS  pickIsbn13: two space-separated values -> trailing 13-digit; single value -> as-is; empty -> empty");
  }

  {
    assert.equal(formatPublished("2019-09-25T00:00:00.000+09:00"), "2019.09");
    assert.equal(formatPublished(""), "");
    console.log("PASS  formatPublished: ISO datetime -> \"YYYY.MM\"; empty -> empty");
  }

  console.log("\nALL PASS");
}

main();
