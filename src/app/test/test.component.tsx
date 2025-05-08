// @ts-nocheck
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from "@angular/core";
// @ts-ignore
import {
  _IMMUTABLE,
  _jsxC,
  _jsxQ,
  componentQrl,
  qrlDEV,
  render,
  SSRStream,
  SSRStreamBlock,
} from "@builder.io/qwik";
// import { _IMMUTABLE, _jsxC, _jsxQ } from "@builder.io/qwik";
// import type { StreamWriter } from "@builder.io/qwik";

import { renderToString } from "@builder.io/qwik/server";
var dev = true;

export const fixRemotePathsInDevMode = (
  rawHtml: string,
  base = "",
): { html: string; base: string } => {
  let html = rawHtml;
  if (dev) {
    html = html.replace(/q:base="\/(\w+)\/build\/"/gm, (match, child) => {
      base = "/" + child;
      console.log("FOUND", base);
      return match;
    });
    html = html.replace(/from "\/src/gm, () => {
      console.log("REPLACE", path);
      return `from "/${base}/src`;
    });
    html = html.replace(/="(\/src\/([^"]+))"/gm, (_, path) => {
      console.log("REPLACE", path);
      return '="' + base + path + '"';
    });
    html = html.replace(/"\\u0002(\/src\/([^"]+))"/gm, (_, path) => {
      console.log("REPLACE", path);
      return '"\\u0002' + base + path + '"';
    });
  }
  html = fixErroredHostClash(html, base);
  html = fixImageWarningClash(html, base);
  return { html, base };
};

const fixErroredHostClash = (html: string, base: string) =>
  html
    .replace(/ErroredHost/gm, `ErroredHost${base.replace("/", "")}`)
    .replace(/errored-host/gm, `errored-host-${base.replace("/", "")}`);

const fixImageWarningClash = (html: string, base: string) =>
  html.replace(/image-warning/gm, `image-warning-${base.replace("/", "")}`);

export interface RemoteData {
  name: string;
  url: string;
}

export interface Props {
  remote: RemoteData;
  removeLoader?: boolean;
  token?: string;
}

// const app_component_Ncbm0Trxwgc = ({
//   remote = { url: "http://localhost:5173", name: "main" },
//   removeLoader = true,
// }) => {
//   const decoder = new TextDecoder();
//   const getSSRStreamFunction =
//     (remoteUrl: string) => async (stream: StreamWriter) => {
//       const _remoteUrl = new URL(remoteUrl);
//       if (removeLoader) _remoteUrl.searchParams.append("loader", "false");
//       let remoteResponse;
//       try {
//         remoteResponse = await fetch(_remoteUrl, {
//           headers: {
//             accept: "text/html",
//           },
//         });
//       } catch (err) {
//         console.error(err);
//         return stream.write("<div>Remote unavailable</div>");
//       }
//       const reader = remoteResponse.body?.getReader();
//       if (!reader) return stream.write("<div>remote reader unavailable</div>");
//       let fragmentChunk = await reader.read();
//       let base = "";
//       let html = "";
//       while (!fragmentChunk.done) {
//         const rawHtml = decoder.decode(fragmentChunk.value);
//         const fixedHtmlObj = fixRemotePathsInDevMode(rawHtml, base);
//         base = fixedHtmlObj.base;
//         stream.write(fixedHtmlObj.html);
//         console.log(fixedHtmlObj.html);
//         html += fixedHtmlObj.html;
//         fragmentChunk = await reader.read();
//       }
//       const mount = document.createElement("div");
//       mount.innerHTML = html;
//       document.getElementsByTagName("qwik-webc")[0].append(mount);
//     };
//   return /*#__PURE__*/ _jsxC(
//     SSRStreamBlock,
//     {
//       children: /*#__PURE__*/ _jsxC(
//         SSRStream,
//         {
//           children: getSSRStreamFunction(remote.url),
//         },
//         1,
//         "4e_0",
//         {
//           fileName: "app.tsx",
//           lineNumber: 84,
//           columnNumber: 7,
//         },
//       ),
//     },
//     1,
//     "4e_1",
//     {
//       fileName: "app.tsx",
//       lineNumber: 83,
//       columnNumber: 5,
//     },
//   );
// };

// const t = _jsxC(
//   // @ts-ignore
//   Comp,
//   {
//     remote: { url: "http://localhost:5173", name: "main" },
//     [_IMMUTABLE]: {
//       remote: _IMMUTABLE,
//     },
//   },
//   3,
//   "4e_0",
// );

class QwikWebC extends HTMLElement {
  async connectedCallback() {
    const remotes = {
      home: {
        name: "/home",
        url: "http://localhost:5173",
      },
      checkout: {
        name: "checkout",
        url: "http://localhost:4175/checkout/",
      },
    };

    const app_component_Ncbm0Trxwgc = ({
      remote = remotes["home"],
      removeLoader = false,
    }) => {
      const decoder = new TextDecoder();
      const getSSRStreamFunction = (remoteUrl) => async (stream) => {
        const _remoteUrl = new URL(remoteUrl);
        if (removeLoader) _remoteUrl.searchParams.append("loader", "false");
        let remoteResponse;
        try {
          remoteResponse = await fetch(_remoteUrl, {
            headers: {
              accept: "text/html",
            },
          });
        } catch (err) {
          console.error(err);
          return stream.write("<div>Remote unavailable</div>");
        }
        const reader = remoteResponse.body.getReader();
        let fragmentChunk = await reader.read();
        let base = "";
        let html = "";
        while (!fragmentChunk.done) {
          const rawHtml = decoder.decode(fragmentChunk.value);
          const fixedHtmlObj = fixRemotePathsInDevMode(rawHtml, base);
          base = fixedHtmlObj.base;
          stream.write(fixedHtmlObj.html);
          html += fixedHtmlObj.html;
          fragmentChunk = await reader.read();
        }
        const node = document.createElement("div");
        const root = document.getElementsByTagName("qwik-webc")[0];
        const parser = new DOMParser();
        const htmlDocument = parser.parseFromString(html, "text/html");
        const scripts = htmlDocument.querySelectorAll("script");
        scripts.forEach((s) => {
          const newScript = document.createElement("script");
          for (const { name, value } of s.attributes) {
            newScript.setAttribute(name, value);
          }
          newScript.innerHTML = s.innerHTML;
          root.appendChild(newScript);
          s.parentNode?.removeChild(s);
        });
        node.innerHTML = htmlDocument.documentElement.innerHTML;
        root.appendChild(node);
      };
      return /*#__PURE__*/ _jsxC(
        SSRStreamBlock,
        {
          children: /*#__PURE__*/ _jsxC(
            SSRStream,
            {
              children: getSSRStreamFunction(remote.url),
            },
            1,
            "4e_0",
            {
              fileName: "app.tsx",
              lineNumber: 84,
              columnNumber: 7,
            },
          ),
        },
        1,
        "4e_1",
        {
          fileName: "app.tsx",
          lineNumber: 83,
          columnNumber: 5,
        },
      );
    };

    var app_tsx_app_component_Ncbm0Trxwgc = /*#__PURE__*/ Object.freeze({
      __proto__: null,
      app_component_Ncbm0Trxwgc: app_component_Ncbm0Trxwgc,
    });

    var app = /*#__PURE__*/ componentQrl(
      /*#__PURE__*/ qrlDEV(
        () =>
          Promise.resolve().then(function () {
            return app_tsx_app_component_Ncbm0Trxwgc;
          }),
        "app_component_Ncbm0Trxwgc",
        {
          file: "/app.tsx",
          lo: 1673,
          hi: 2850,
          displayName: "app.tsx_app_component",
        },
      ),
    );

    // export {
    //   app as a,
    //   app_component_Ncbm0Trxwgc as b,
    //   fixRemotePathsInDevMode as f,
    //   parseBundleGraph as g,
    //   handleBundle as h,
    //   loadBundleGraph as l,
    //   preload as p,
    //   remotes as r,
    // };
    return renderToString(app_component_Ncbm0Trxwgc({}), {
      containerTagName: "div",
      base: "/",
      qwikLoader: { include: "always" },
    });
    // return render(this, /*#__PURE__*/ app_component_Ncbm0Trxwgc({}));
    return render(
      this,
      /*#__PURE__*/ _jsxQ("p", null, null, "I am qwik", 3, "4e_0"),
    );
    //
    // @ts-ignore
    // const { t } = await import("../../../public/qwikPreloader.js");
    // renderToString(t, { containerTagName: "div" });
    // return renderToStream( t , {});
  }
}

@Component({
  selector: "app-test",
  standalone: true,
  templateUrl: "./test.component.html",
  styleUrl: "./test.component.css",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TestComponent implements OnInit {
  ngOnInit(): void {
    customElements.define("qwik-webc", QwikWebC);
  }
}

/*
export const fixRemotePathsInDevMode = (rawHtml: string, base = ''): { html: string; base: string } => {
	let html = rawHtml;
	if (import.meta.env.DEV) {
		html = html.replace(/q:base="\/(\w+)\/build\/"/gm, (match, child) => {
			base = '/' + child;
			// console.log('FOUND', base);
			return match;
		});
		html = html.replace(/from "\/src/gm, () => {
			// console.log('REPLACE', path);
			return `from "/${base}/src`;
		});
		html = html.replace(/="(\/src\/([^"]+))"/gm, (_, path) => {
			// console.log('REPLACE', path);
			return '="' + base + path + '"';
		});
		html = html.replace(/"\\u0002(\/src\/([^"]+))"/gm, (_, path) => {
			// console.log('REPLACE', path);
			return '"\\u0002' + base + path + '"';
		});
	}
	html = fixErroredHostClash(html, base);
	html = fixImageWarningClash(html, base);
	return { html, base };
};

const fixErroredHostClash = (html: string, base: string) =>
	html.replace(/ErroredHost/gm, `ErroredHost${base.replace('/', '')}`).replace(/errored-host/gm, `errored-host-${base.replace('/', '')}`);

const fixImageWarningClash = (html: string, base: string) => html.replace(/image-warning/gm, `image-warning-${base.replace('/', '')}`);


import type { StreamWriter } from "@builder.io/qwik";
import { component$, SSRStream, SSRStreamBlock } from "@builder.io/qwik";
export interface RemoteData {
	name: string;
	url: string;
}

export const remotes: Record<string, RemoteData> = {
	home: { name: 'home', url: 'http://localhost:4174/home/' },
	checkout: { name: 'checkout', url: 'http://localhost:4175/checkout/' },
};

export interface Props {
  remote: RemoteData;
  removeLoader?: boolean;
  token?: string;
}

export default component$(({ remote = remotes["home"], removeLoader = false }: Props) => {
  const url = remote.url;
  const decoder = new TextDecoder();
  const getSSRStreamFunction =
    (remoteUrl: string) => async (stream: StreamWriter) => {
      const _remoteUrl = new URL(remoteUrl);
      if (removeLoader) {
        _remoteUrl.searchParams.append("loader", "false");
      }
      let remoteResponse;
      try {
       remoteResponse = await fetch(_remoteUrl, {
          headers: {
            accept: "text/html",
          },
        })
      } catch(err){console.error(err); return stream.write("<div>Remote unavailable</div>")}
      const reader = (
        remoteResponse
      ).body!.getReader();
      let fragmentChunk = await reader.read();
      let base = "";
      while (!fragmentChunk.done) {
        const rawHtml = decoder.decode(fragmentChunk.value);
        const fixedHtmlObj = fixRemotePathsInDevMode(rawHtml, base);
        base = fixedHtmlObj.base;
        stream.write(fixedHtmlObj.html);
        fragmentChunk = await reader.read();
      }
    };

  return (
    <SSRStreamBlock>
      <SSRStream>{getSSRStreamFunction(url)}</SSRStream>
    </SSRStreamBlock>
  );
});*/
