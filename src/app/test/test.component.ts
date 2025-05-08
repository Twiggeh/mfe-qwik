import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';

var dev = true;

export const fixRemotePathsInDevMode = (
  rawHtml: string,
  base = '',
): { html: string; base: string } => {
  let html = rawHtml;
  if (dev) {
    html = html.replace(/q:base="\/(\w+)\/build\/"/gm, (match, child) => {
      base = '/' + child;
      console.log('FOUND', base);
      return match;
    });
    html = html.replace(/from "\/src/gm, (_, path) => {
      console.log('REPLACE', path);
      return `from "/${base}/src`;
    });
    html = html.replace(/="(\/src\/([^"]+))"/gm, (_, path) => {
      console.log('REPLACE', path);
      return '="' + base + path + '"';
    });
    html = html.replace(/"\\u0002(\/src\/([^"]+))"/gm, (_, path) => {
      console.log('REPLACE', path);
      return '"\\u0002' + base + path + '"';
    });
  }
  html = fixErroredHostClash(html, base);
  html = fixImageWarningClash(html, base);
  return { html, base };
};

const fixErroredHostClash = (html: string, base: string) =>
  html
    .replace(/ErroredHost/gm, `ErroredHost${base.replace('/', '')}`)
    .replace(/errored-host/gm, `errored-host-${base.replace('/', '')}`);

const fixImageWarningClash = (html: string, base: string) =>
  html.replace(/image-warning/gm, `image-warning-${base.replace('/', '')}`);

const writeHtml = (html: string) => {
  const node = document.createElement('div');
  const root = document.getElementsByTagName('qwik-webc')[0];
  const parser = new DOMParser();
  const htmlDocument = parser.parseFromString(html, 'text/html');
  const scripts = htmlDocument.querySelectorAll('script');
  scripts.forEach((s) => {
    const newScript = document.createElement('script');
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

class QwikWebC extends HTMLElement {
  async connectedCallback() {
    let removeLoader = false;
    const remotes = {
      home: {
        name: '/home',
        url: 'http://localhost:5173',
      },
      checkout: {
        name: 'checkout',
        url: 'http://localhost:4175/checkout/',
      },
    };
    const remoteUrl = remotes['home'].url;

    let html = '';
    const decoder = new TextDecoder();
    const _remoteUrl = new URL(remoteUrl);
    if (removeLoader) _remoteUrl.searchParams.append('loader', 'false');
    let remoteResponse;
    try {
      remoteResponse = await fetch(_remoteUrl, {
        headers: {
          accept: 'text/html',
        },
      });
    } catch (err) {
      console.error(err);
      html += '<div>Remote unavailable</div>';
      return writeHtml(html);
    }
    const reader = remoteResponse.body?.getReader();
    if (!reader) {
      html += '<div>Remote unavailable</div>';
      return writeHtml(html);
    }
    let fragmentChunk = await reader.read();
    let base = '';
    while (!fragmentChunk.done) {
      const rawHtml = decoder.decode(fragmentChunk.value);
      const fixedHtmlObj = fixRemotePathsInDevMode(rawHtml, base);
      base = fixedHtmlObj.base;
      html += fixedHtmlObj.html;
      fragmentChunk = await reader.read();
    }
    return writeHtml(html);
  }
}

@Component({
  selector: 'app-test',
  standalone: true,
  templateUrl: './test.component.html',
  styleUrl: './test.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TestComponent implements OnInit {
  ngOnInit(): void {
    customElements.define('qwik-webc', QwikWebC);
  }
}
