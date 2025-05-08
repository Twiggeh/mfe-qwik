// @builder.io/qwik/build
const isServer = false;
const isBrowser = true;

const doc = isBrowser ? document : void 0;
const modulePreloadStr = "modulepreload";
const preloadStr = "preload";
const config = { t: 0, o: 25, l: 0.65 };
const rel =
  isBrowser && doc.createElement("link").relList.supports(modulePreloadStr)
    ? modulePreloadStr
    : preloadStr;
const loadStart = Date.now();
const BundleImportState_None = 0;
const BundleImportState_Queued = 1;
const BundleImportState_Preload = 2;
const BundleImportState_Alias = 3;
const BundleImportState_Loaded = 4;
const bundles = /* @__PURE__ */ new Map();
let queueDirty;
let preloadCount = 0;
const queue = [];
const log = (...e) => {
  console.log(
    `Preloader ${Date.now() - loadStart}ms ${preloadCount}/${queue.length} queued>`,
    ...e,
  );
};
const sortQueue = () => {
  if (queueDirty) {
    queue.sort((e, t) => e.u - t.u);
    queueDirty = 0;
  }
};
const trigger = () => {
  if (!queue.length) return;
  sortQueue();
  while (queue.length) {
    const e = queue[0];
    const t = e.u;
    const o = 1 - t;
    const n = graph
      ? // The more likely the bundle, the more simultaneous preloads we want to allow
        Math.max(1, config.o * o)
      : // While the graph is not available, we limit to 2 preloads
        2;
    if (o === 1 || preloadCount < n) {
      queue.shift();
      preloadOne(e);
    } else break;
  }
  if (config.t && !queue.length) {
    const e = [...bundles.values()].filter(
      (e2) => e2.i > BundleImportState_None,
    );
    const t = e.reduce((e2, t2) => e2 + t2.p, 0);
    const o = e.reduce((e2, t2) => e2 + t2.$, 0);
    log(
      `>>>> done ${e.length}/${bundles.size} total: ${t}ms waited, ${o}ms loaded`,
    );
  }
};
const preloadOne = (e) => {
  if (e.i >= BundleImportState_Preload) return;
  preloadCount++;
  const t = Date.now();
  e.p = t - e.B;
  e.i = BundleImportState_Preload;
  config.t &&
    log(`<< load ${Math.round((1 - e.u) * 100)}% after ${`${e.p}ms`}`, e.m);
  const o = doc.createElement("link");
  o.href = e.h;
  o.rel = rel;
  o.as = "script";
  o.onload = o.onerror = () => {
    preloadCount--;
    const n = Date.now();
    e.$ = n - t;
    e.i = BundleImportState_Loaded;
    config.t && log(`>> done after ${e.$}ms`, e.m);
    o.remove();
    trigger();
  };
  doc.head.appendChild(o);
};
const adjustProbabilities = (e, t, o) => {
  if (o == null ? void 0 : o.has(e)) return;
  const n = e.u;
  e.u *= t;
  if (n - e.u < 0.01) return;
  if (e.i < BundleImportState_Preload && e.u < config.l) {
    if (e.i === BundleImportState_None) {
      e.i = BundleImportState_Queued;
      queue.push(e);
      config.t && log(`queued ${Math.round((1 - e.u) * 100)}%`, e.m);
    }
    queueDirty = 1;
  }
  if (e.S) {
    o || (o = /* @__PURE__ */ new Set());
    o.add(e);
    const t2 = 1 - e.u;
    for (const n2 of e.S) {
      const e2 = getBundle(n2.m);
      const r = n2.q;
      const l = 1 - n2.I * t2;
      const a = l / r;
      n2.q = a;
      adjustProbabilities(e2, a, o);
    }
  }
};
const handleBundle = (e, t) => {
  const o = getBundle(e);
  if (o && o.u > t) adjustProbabilities(o, t / o.u);
};
const preload = (e, t) => {
  if (base == null || !e.length) return;
  let o = t ? 1 - t : 0.4;
  if (Array.isArray(e))
    for (let t2 = e.length - 1; t2 >= 0; t2--) {
      const n = e[t2];
      if (typeof n === "number") o = 1 - n / 10;
      else {
        handleBundle(n, o);
        o *= 1.005;
      }
    }
  else handleBundle(e, o);
  trigger();
};
let base;
let graph;
const makeBundle = (e, t) => {
  const o = e.endsWith(".js")
    ? doc
      ? new URL(`${base}${e}`, doc.baseURI).toString()
      : e
    : null;
  return {
    m: e,
    h: o,
    i: o ? BundleImportState_None : BundleImportState_Alias,
    S: t,
    u: 1,
    B: Date.now(),
    p: 0,
    $: 0,
  };
};
const parseBundleGraph = (e) => {
  const t = /* @__PURE__ */ new Map();
  let o = 0;
  while (o < e.length) {
    const n = e[o++];
    const r = [];
    let l;
    let a = 1;
    while (((l = e[o]), typeof l === "number")) {
      if (l < 0) a = -l / 10;
      else r.push({ m: e[l], I: a, q: 1 });
      o++;
    }
    t.set(n, r);
  }
  return t;
};
const getBundle = (e) => {
  let t = bundles.get(e);
  if (!t) {
    let o;
    if (graph) {
      o = graph.get(e);
      if (!o) return;
      if (!o.length) o = void 0;
    }
    t = makeBundle(e, o);
    bundles.set(e, t);
  }
  return t;
};
const loadBundleGraph = (e, t, o) => {
  if (o) {
    if ("d" in o) config.t = !!o.d;
    if ("P" in o) config.o = o["P"];
    if ("Q" in o) config.l = 1 - o["Q"];
  }
  if (e == null) return;
  base = e;
  if (t)
    t.then((e2) => e2.text())
      .then((e2) => {
        graph = parseBundleGraph(JSON.parse(e2));
        const t2 = [];
        for (const [e3, o2] of graph.entries()) {
          const n = getBundle(e3);
          n.S = o2;
          if (n.u < 1) {
            t2.push([n, n.u]);
            n.u = 1;
          }
        }
        config.t &&
          log(
            `parseBundleGraph got ${graph.size} bundles, adjusting ${t2.length}`,
          );
        for (const [e3, o2] of t2) adjustProbabilities(e3, o2);
        trigger();
      })
      .catch(console.warn);
};

/**
 * @license
 * @builder.io/qwik 1.13.0-dev+b54ecc1
 * Copyright Builder.io, Inc. All Rights Reserved.
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/QwikDev/qwik/blob/main/LICENSE
 */

const qDev = globalThis.qDev !== false;
const qSerialize = globalThis.qSerialize !== false;
const qDynamicPlatform = globalThis.qDynamicPlatform !== false;
const qTest = globalThis.qTest === true;
const qRuntimeQrl = globalThis.qRuntimeQrl === true;
const seal = (obj) => {
  if (qDev) {
    Object.seal(obj);
  }
};

const isNode$1 = (value) => {
  return value && typeof value.nodeType === "number";
};
const isDocument = (value) => {
  return value.nodeType === 9;
};
const isElement$1 = (value) => {
  return value.nodeType === 1;
};
const isVirtualElement = (value) => {
  return value.nodeType === 111;
};

const STYLE = qDev
  ? `background: #564CE0; color: white; padding: 2px 3px; border-radius: 2px; font-size: 0.8em;`
  : "";
const logError = (message, ...optionalParams) => {
  return createAndLogError(false, message, ...optionalParams);
};
const throwErrorAndStop = (message, ...optionalParams) => {
  const error = createAndLogError(false, message, ...optionalParams);
  // eslint-disable-next-line no-debugger
  debugger;
  throw error;
};
const logErrorAndStop = (message, ...optionalParams) => {
  const err = createAndLogError(qDev, message, ...optionalParams);
  // eslint-disable-next-line no-debugger
  debugger;
  return err;
};
const _printed = /*#__PURE__*/ new Set();
const logOnceWarn = (message, ...optionalParams) => {
  if (qDev) {
    const key = "warn" + String(message);
    if (!_printed.has(key)) {
      _printed.add(key);
      logWarn(message, ...optionalParams);
    }
  }
};
const logWarn = (message, ...optionalParams) => {
  if (qDev) {
    console.warn("%cQWIK WARN", STYLE, message, ...printParams(optionalParams));
  }
};
const tryGetContext$1 = (element) => {
  return element["_qc_"];
};
const printParams = (optionalParams) => {
  if (qDev) {
    return optionalParams.map((p) => {
      if (isNode$1(p) && isElement$1(p)) {
        return printElement(p);
      }
      return p;
    });
  }
  return optionalParams;
};
const printElement = (el) => {
  const ctx = tryGetContext$1(el);
  const isServer = /*#__PURE__*/ (() =>
    typeof process !== "undefined" &&
    !!process.versions &&
    !!process.versions.node)();
  return {
    tagName: el.tagName,
    renderQRL: ctx?.$componentQrl$?.getSymbol(),
    element: isServer ? undefined : el,
    ctx: isServer ? undefined : ctx,
  };
};
const createAndLogError = (asyncThrow, message, ...optionalParams) => {
  const err = message instanceof Error ? message : new Error(message);
  // display the error message first, then the optional params, and finally the stack trace
  // the stack needs to be displayed last because the given params will be lost among large stack traces so it will
  // provide a bad developer experience
  console.error(
    "%cQWIK ERROR",
    STYLE,
    err.message,
    ...printParams(optionalParams),
    err.stack,
  );
  asyncThrow &&
    !qTest &&
    setTimeout(() => {
      // throwing error asynchronously to avoid breaking the current call stack.
      // We throw so that the error is delivered to the global error handler for
      // reporting it to a third-party tools such as Qwik Insights, Sentry or New Relic.
      throw err;
    }, 0);
  return err;
};

const ASSERT_DISCLAIMER =
  "Internal assert, this is likely caused by a bug in Qwik: ";
function assertDefined(value, text, ...parts) {
  if (qDev) {
    if (value != null) {
      return;
    }
    throwErrorAndStop(ASSERT_DISCLAIMER + text, ...parts);
  }
}
function assertTrue(value1, text, ...parts) {
  if (qDev) {
    if (value1 === true) {
      return;
    }
    throwErrorAndStop(ASSERT_DISCLAIMER + text, ...parts);
  }
}
function assertNumber(value1, text, ...parts) {
  if (qDev) {
    if (typeof value1 === "number") {
      return;
    }
    throwErrorAndStop(ASSERT_DISCLAIMER + text, ...parts);
  }
}
function assertString(value1, text, ...parts) {
  if (qDev) {
    if (typeof value1 === "string") {
      return;
    }
    throwErrorAndStop(ASSERT_DISCLAIMER + text, ...parts);
  }
}

const codeToText = (code, ...parts) => {
  if (qDev) {
    // Keep one error, one line to make it easier to search for the error message.
    const MAP = [
      "Error while serializing class or style attributes", // 0
      "Can not serialize a HTML Node that is not an Element", // 1
      "Runtime but no instance found on element.", // 2
      "Only primitive and object literals can be serialized", // 3
      "Crash while rendering", // 4
      "You can render over a existing q:container. Skipping render().", // 5
      "Set property {{0}}", // 6
      "Only function's and 'string's are supported.", // 7
      "Only objects can be wrapped in 'QObject'", // 8
      `Only objects literals can be wrapped in 'QObject'`, // 9
      "QRL is not a function", // 10
      "Dynamic import not found", // 11
      "Unknown type argument", // 12
      `Actual value for useContext({{0}}) can not be found, make sure some ancestor component has set a value using useContextProvider(). In the browser make sure that the context was used during SSR so its state was serialized.`, // 13
      "Invoking 'use*()' method outside of invocation context.", // 14
      "Cant access renderCtx for existing context", // 15
      "Cant access document for existing context", // 16
      "props are immutable", // 17
      "<div> component can only be used at the root of a Qwik component$()", // 18
      "Props are immutable by default.", // 19
      `Calling a 'use*()' method outside 'component$(() => { HERE })' is not allowed. 'use*()' methods provide hooks to the 'component$' state and lifecycle, ie 'use' hooks can only be called synchronously within the 'component$' function or another 'use' method.\nSee https://qwik.dev/docs/components/tasks/#use-method-rules`, // 20
      "Container is already paused. Skipping", // 21
      "", // 22 -- unused
      "When rendering directly on top of Document, the root node must be a <html>", // 23
      "A <html> node must have 2 children. The first one <head> and the second one a <body>", // 24
      'Invalid JSXNode type "{{0}}". It must be either a function or a string. Found:', // 25
      "Tracking value changes can only be done to useStore() objects and component props", // 26
      "Missing Object ID for captured object", // 27
      'The provided Context reference "{{0}}" is not a valid context created by createContextId()', // 28
      "<html> is the root container, it can not be rendered inside a component", // 29
      "QRLs can not be resolved because it does not have an attached container. This means that the QRL does not know where it belongs inside the DOM, so it cant dynamically import() from a relative path.", // 30
      "QRLs can not be dynamically resolved, because it does not have a chunk path", // 31
      "The JSX ref attribute must be a Signal", // 32
    ];
    let text = MAP[code] ?? "";
    if (parts.length) {
      text = text.replaceAll(/{{(\d+)}}/g, (_, index) => {
        let v = parts[index];
        if (v && typeof v === "object" && v.constructor === Object) {
          v = JSON.stringify(v).slice(0, 50);
        }
        return v;
      });
    }
    return `Code(${code}): ${text}`;
  } else {
    // cute little hack to give roughly the correct line number. Update the line number if it shifts.
    return `Code(${code}) https://github.com/QwikDev/qwik/blob/main/packages/qwik/src/core/error/error.ts#L${8 + code}`;
  }
};
const QError_verifySerializable = 3;
const QError_qrlIsNotFunction = 10;
const QError_dynamicImportFailed = 11;
const QError_unknownTypeArgument = 12;
const QError_qrlMissingContainer = 30;
const QError_qrlMissingChunk = 31;
const qError = (code, ...parts) => {
  const text = codeToText(code, ...parts);
  return logErrorAndStop(text, ...parts);
};

// keep this import from qwik/build so the cjs build works
const createPlatform = () => {
  return {
    isServer,
    importSymbol(containerEl, url, symbolName) {
      if (!url) {
        throw qError(QError_qrlMissingChunk, symbolName);
      }
      if (!containerEl) {
        throw qError(QError_qrlMissingContainer, url, symbolName);
      }
      const urlDoc = toUrl(
        containerEl.ownerDocument,
        containerEl,
        url,
      ).toString();
      const urlCopy = new URL(urlDoc);
      urlCopy.hash = "";
      const importURL = urlCopy.href;
      return import(/* @vite-ignore */ importURL).then((mod) => {
        return mod[symbolName];
      });
    },
    raf: (fn) => {
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          resolve(fn());
        });
      });
    },
    nextTick: (fn) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(fn());
        });
      });
    },
    chunkForSymbol(symbolName, chunk) {
      return [symbolName, chunk ?? "_"];
    },
  };
};
/**
 * Convert relative base URI and relative URL into a fully qualified URL.
 *
 * @param base -`QRL`s are relative, and therefore they need a base for resolution.
 *
 *   - `Element` use `base.ownerDocument.baseURI`
 *   - `Document` use `base.baseURI`
 *   - `string` use `base` as is
 *   - `QConfig` use `base.baseURI`
 *
 * @param url - Relative URL
 * @returns Fully qualified URL.
 */
const toUrl = (doc, containerEl, url) => {
  const baseURI = doc.baseURI;
  const base = new URL(containerEl.getAttribute("q:base") ?? baseURI, baseURI);
  return new URL(url, base);
};
let _platform = /*#__PURE__ */ createPlatform();
// <docs markdown="./readme.md#getPlatform">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ./readme.md#getPlatform instead)
/**
 * Retrieve the `CorePlatform`.
 *
 * The `CorePlatform` is also responsible for retrieving the Manifest, that contains mappings from
 * symbols to javascript import chunks. For this reason, `CorePlatform` can't be global, but is
 * specific to the application currently running. On server it is possible that many different
 * applications are running in a single server instance, and for this reason the `CorePlatform` is
 * associated with the application document.
 *
 * @param docOrNode - The document (or node) of the application for which the platform is needed.
 * @public
 */
// </docs>
const getPlatform = () => {
  return _platform;
};
const isServerPlatform = () => {
  if (qDynamicPlatform) {
    return _platform.isServer;
  }
  return false;
};

/** @private */
const isSerializableObject = (v) => {
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};
const isObject = (v) => {
  return !!v && typeof v === "object";
};
const isArray = (v) => {
  return Array.isArray(v);
};
const isString = (v) => {
  return typeof v === "string";
};
const isFunction = (v) => {
  return typeof v === "function";
};

const isPromise = (value) => {
  // not using "value instanceof Promise" to have zone.js support
  return value && typeof value.then === "function";
};
const maybeThen = (promise, thenFn) => {
  return isPromise(promise) ? promise.then(thenFn) : thenFn(promise);
};

// import { qDev } from './qdev';
const EMPTY_ARRAY = [];
const EMPTY_OBJ = {};
if (qDev) {
  Object.freeze(EMPTY_ARRAY);
  Object.freeze(EMPTY_OBJ);
}

/** State factory of the component. */
const OnRenderProp = "q:renderFn";
/** `<some-element q:slot="...">` */
const QSlot = "q:slot";
const QSlotS = "q:s";
const QInstance = "q:instance";
const QFuncsPrefix = "qFuncs_";
const getQFuncs = (document, hash) => {
  return document[QFuncsPrefix + hash] || [];
};
const QLocaleAttr = "q:locale";
const QContainerSelector = "[q\\:container]";
const ResourceEvent = "qResource";
const ComputedEvent = "qComputed";
const RenderEvent = "qRender";
const QObjectImmutable = 1 << 1;
const QOjectTargetSymbol = Symbol("proxy target");
const QObjectFlagsSymbol = Symbol("proxy flags");
const QObjectManagerSymbol = Symbol("proxy manager");
/** @internal */
const _IMMUTABLE = Symbol("IMMUTABLE");
/**
 * @internal
 * Key for the `QContext` object stored on QwikElements
 */
const Q_CTX = "_qc_";
const static_subtree = 1 << 1;
const serializeDerivedSignalFunc = (signal) => {
  const fnBody = qSerialize ? signal.$funcStr$ : "null";
  assertDefined(fnBody, "If qSerialize is true then fnStr must be provided.");
  let args = "";
  for (let i = 0; i < signal.$args$.length; i++) {
    args += `p${i},`;
  }
  return `(${args})=>(${fnBody})`;
};

/**
 * @internal
 *
 * Create a JSXNode for a string tag
 */
const _jsxQ = (
  type,
  mutableProps,
  immutableProps,
  children,
  flags,
  key,
  dev,
) => {
  assertString(type, "jsx type must be a string");
  const processed = key == null ? null : String(key);
  const node = new JSXNodeImpl(
    type,
    mutableProps || EMPTY_OBJ,
    immutableProps,
    children,
    flags,
    processed,
  );
  if (qDev && dev) {
    node.dev = {
      stack: new Error().stack,
      ...dev,
    };
  }
  validateJSXNode(node);
  seal(node);
  return node;
};
/**
 * @internal
 *
 * Create a JSXNode for any tag, with possibly immutable props embedded in props
 */
const _jsxC = (type, mutableProps, flags, key, dev) => {
  const processed = key == null ? null : String(key);
  const props = mutableProps ?? {};
  // In dynamic components, type could be a string
  if (typeof type === "string" && _IMMUTABLE in props) {
    const immutableProps = props[_IMMUTABLE];
    delete props[_IMMUTABLE];
    const children = props.children;
    delete props.children;
    // Immutable handling for string tags is a bit different, merge all and consider immutable
    for (const [k, v] of Object.entries(immutableProps)) {
      if (v !== _IMMUTABLE) {
        delete props[k];
        props[k] = v;
      }
    }
    return _jsxQ(type, null, props, children, flags, key, dev);
  }
  const node = new JSXNodeImpl(
    type,
    props,
    null,
    props.children,
    flags,
    processed,
  );
  if (typeof type === "string" && mutableProps) {
    delete mutableProps.children;
  }
  if (qDev && dev) {
    node.dev = {
      stack: new Error().stack,
      ...dev,
    };
  }
  validateJSXNode(node);
  seal(node);
  return node;
};
/**
 * @public
 * Used by the JSX transpilers to create a JSXNode.
 * Note that the optimizer will not use this, instead using _jsxQ, _jsxS, and _jsxC directly.
 */
const jsx = (type, props, key) => {
  const processed = key == null ? null : String(key);
  const children = untrack(() => {
    const c = props.children;
    if (typeof type === "string") {
      delete props.children;
    }
    return c;
  });
  if (isString(type)) {
    if ("className" in props) {
      props.class = props.className;
      delete props.className;
      if (qDev) {
        logOnceWarn("jsx: `className` is deprecated. Use `class` instead.");
      }
    }
  }
  const node = new JSXNodeImpl(type, props, null, children, 0, processed);
  validateJSXNode(node);
  seal(node);
  return node;
};
class JSXNodeImpl {
  type;
  props;
  immutableProps;
  children;
  flags;
  key;
  dev;
  constructor(type, props, immutableProps, children, flags, key = null) {
    this.type = type;
    this.props = props;
    this.immutableProps = immutableProps;
    this.children = children;
    this.flags = flags;
    this.key = key;
  }
}
/** @public */
const Virtual = (props) => props.children;
/** @public */
const RenderOnce = (props, key) => {
  return new JSXNodeImpl(
    Virtual,
    EMPTY_OBJ,
    null,
    props.children,
    static_subtree,
    key,
  );
};
const validateJSXNode = (node) => {
  if (qDev) {
    const { type, props, immutableProps, children } = node;
    invoke(undefined, () => {
      const isQwikC = isQwikComponent(type);
      if (!isString(type) && !isFunction(type)) {
        throw new Error(
          `The <Type> of the JSX element must be either a string or a function. Instead, it's a "${typeof type}": ${String(type)}.`,
        );
      }
      if (children) {
        const flatChildren = isArray(children) ? children.flat() : [children];
        if (isString(type) || isQwikC) {
          flatChildren.forEach((child) => {
            if (!isValidJSXChild(child)) {
              const typeObj = typeof child;
              let explanation = "";
              if (typeObj === "object") {
                if (child?.constructor) {
                  explanation = `it's an instance of "${child?.constructor.name}".`;
                } else {
                  explanation = `it's a object literal: ${printObjectLiteral(child)} `;
                }
              } else if (typeObj === "function") {
                explanation += `it's a function named "${child.name}".`;
              } else {
                explanation = `it's a "${typeObj}": ${String(child)}.`;
              }
              throw new Error(
                `One of the children of <${type}> is not an accepted value. JSX children must be either: string, boolean, number, <element>, Array, undefined/null, or a Promise/Signal. Instead, ${explanation}\n`,
              );
            }
          });
        }
        {
          if (isFunction(type) || immutableProps) {
            const keys = {};
            flatChildren.forEach((child) => {
              if (isJSXNode(child) && child.key != null) {
                const key = String(child.type) + ":" + child.key;
                if (keys[key]) {
                  const err = createJSXError(
                    `Multiple JSX sibling nodes with the same key.\nThis is likely caused by missing a custom key in a for loop`,
                    child,
                  );
                  if (err) {
                    if (isString(child.type)) {
                      logOnceWarn(err);
                    } else {
                      logOnceWarn(err);
                    }
                  }
                } else {
                  keys[key] = true;
                }
              }
            });
          }
        }
      }
      const allProps = [
        ...Object.entries(props),
        ...(immutableProps ? Object.entries(immutableProps) : []),
      ];
      if (!qRuntimeQrl) {
        for (const [prop, value] of allProps) {
          if (prop.endsWith("$") && value) {
            if (!isQrl(value) && !Array.isArray(value)) {
              throw new Error(
                `The value passed in ${prop}={...}> must be a QRL, instead you passed a "${typeof value}". Make sure your ${typeof value} is wrapped with $(...), so it can be serialized. Like this:\n$(${String(value)})`,
              );
            }
          }
          if (prop !== "children" && isQwikC && value) {
            verifySerializable(
              value,
              `The value of the JSX attribute "${prop}" can not be serialized`,
            );
          }
        }
      }
      if (isString(type)) {
        const hasSetInnerHTML = allProps.some(
          (a) => a[0] === "dangerouslySetInnerHTML",
        );
        if (hasSetInnerHTML && children) {
          const err = createJSXError(
            `The JSX element <${type}> can not have both 'dangerouslySetInnerHTML' and children.`,
            node,
          );
          logError(err);
        }
        if (allProps.some((a) => a[0] === "children")) {
          throw new Error(
            `The JSX element <${type}> can not have both 'children' as a property.`,
          );
        }
        if (type === "style") {
          if (children) {
            logOnceWarn(`jsx: Using <style>{content}</style> will escape the content, effectively breaking the CSS.
In order to disable content escaping use '<style dangerouslySetInnerHTML={content}/>'

However, if the use case is to inject component styleContent, use 'useStyles$()' instead, it will be a lot more efficient.
See https://qwik.dev/docs/components/styles/#usestyles for more information.`);
          }
        }
        if (type === "script") {
          if (children) {
            logOnceWarn(`jsx: Using <script>{content}</script> will escape the content, effectively breaking the inlined JS.
In order to disable content escaping use '<script dangerouslySetInnerHTML={content}/>'`);
          }
        }
      }
    });
  }
};
const printObjectLiteral = (obj) => {
  return `{ ${Object.keys(obj)
    .map((key) => `"${key}"`)
    .join(", ")} }`;
};
const isJSXNode = (n) => {
  if (qDev) {
    if (n instanceof JSXNodeImpl) {
      return true;
    }
    if (isObject(n) && "key" in n && "props" in n && "type" in n) {
      logWarn(`Duplicate implementations of "JSXNode" found`);
      return true;
    }
    return false;
  } else {
    return n instanceof JSXNodeImpl;
  }
};
const isValidJSXChild = (node) => {
  if (!node) {
    return true;
  } else if (node === SkipRender) {
    return true;
  } else if (
    isString(node) ||
    typeof node === "number" ||
    typeof node === "boolean"
  ) {
    return true;
  } else if (isJSXNode(node)) {
    return true;
  } else if (isArray(node)) {
    return node.every(isValidJSXChild);
  }
  if (isSignal(node)) {
    return isValidJSXChild(node.value);
  } else if (isPromise(node)) {
    return true;
  }
  return false;
};
/** @public */
const Fragment = (props) => props.children;
const createJSXError = (message, node) => {
  const error = new Error(message);
  if (!node.dev) {
    return error;
  }
  error.stack = `JSXError: ${message}\n${filterStack(node.dev.stack, 1)}`;
  return error;
};
const filterStack = (stack, offset = 0) => {
  return stack.split("\n").slice(offset).join("\n");
};

/** @public */
const SkipRender = Symbol("skip render");
/** @public */
const SSRRaw = () => null;
/** @public */
const SSRComment = (props) =>
  jsx(SSRRaw, { data: `<!--${props.data}-->` }, null);
/** @public */
const SSRStreamBlock = (props) => {
  return [
    jsx(SSRComment, { data: "qkssr-pu" }),
    props.children,
    jsx(SSRComment, { data: "qkssr-po" }),
  ];
};
/** @public */
const SSRStream = (props, key) =>
  jsx(RenderOnce, { children: jsx(InternalSSRStream, props) }, key);
const InternalSSRStream = () => null;
const isSubscriberDescriptor = (obj) => {
  return isObject(obj) && obj instanceof Task;
};
const serializeTask = (task, getObjId) => {
  let value = `${intToStr(task.$flags$)} ${intToStr(task.$index$)} ${getObjId(task.$qrl$)} ${getObjId(task.$el$)}`;
  if (task.$state$) {
    value += ` ${getObjId(task.$state$)}`;
  }
  return value;
};
const parseTask = (data) => {
  const [flags, index, qrl, el, resource] = data.split(" ");
  return new Task(strToInt(flags), strToInt(index), el, qrl, resource);
};
class Task {
  $flags$;
  $index$;
  $el$;
  $qrl$;
  $state$;
  constructor($flags$, $index$, $el$, $qrl$, $state$) {
    this.$flags$ = $flags$;
    this.$index$ = $index$;
    this.$el$ = $el$;
    this.$qrl$ = $qrl$;
    this.$state$ = $state$;
  }
}
const HOST_FLAG_DYNAMIC = 1 << 3;
const tryGetContext = (element) => {
  return element[Q_CTX];
};

let _context;
/** @public */
const tryGetInvokeContext = () => {
  if (!_context) {
    const context =
      typeof document !== "undefined" && document && document.__q_context__;
    if (!context) {
      return undefined;
    }
    if (isArray(context)) {
      return (document.__q_context__ = newInvokeContextFromTuple(context));
    }
    return context;
  }
  return _context;
};
/** Call a function with the given InvokeContext and given arguments. */
function invoke(context, fn, ...args) {
  return invokeApply.call(this, context, fn, args);
}
/** Call a function with the given InvokeContext and array of arguments. */
function invokeApply(context, fn, args) {
  const previousContext = _context;
  let returnValue;
  try {
    _context = context;
    returnValue = fn.apply(this, args);
  } finally {
    _context = previousContext;
  }
  return returnValue;
}
const newInvokeContextFromTuple = ([element, event, url]) => {
  const container = element.closest(QContainerSelector);
  const locale = container?.getAttribute(QLocaleAttr) || undefined;
  return newInvokeContext(locale, undefined, element, event, url);
};
// TODO how about putting url and locale (and event/custom?) in to a "static" object
const newInvokeContext = (locale, hostElement, element, event, url) => {
  // ServerRequestEvent has .locale, but it's not always defined.
  const $locale$ =
    locale ||
    (typeof event === "object" && event && "locale" in event
      ? event.locale
      : undefined);
  const ctx = {
    $url$: url,
    $i$: 0,
    $hostElement$: hostElement,
    $element$: element,
    $event$: event,
    $qrl$: undefined,
    $waitOn$: undefined,
    $subscriber$: undefined,
    $renderCtx$: undefined,
    $locale$,
  };
  seal(ctx);
  return ctx;
};
/**
 * Don't track listeners for this callback
 *
 * @public
 */
const untrack = (fn) => {
  return invoke(undefined, fn);
};
const QObjectSignalFlags = Symbol("proxy manager");
const SIGNAL_IMMUTABLE = 1 << 0;
const SIGNAL_UNASSIGNED = 1 << 1;
const SignalUnassignedException = Symbol("unassigned signal");
class SignalBase {}
class SignalImpl extends SignalBase {
  untrackedValue;
  [QObjectManagerSymbol];
  [QObjectSignalFlags] = 0;
  constructor(v, manager, flags) {
    super();
    this.untrackedValue = v;
    this[QObjectManagerSymbol] = manager;
    this[QObjectSignalFlags] = flags;
  }
  // prevent accidental use as value
  valueOf() {
    if (qDev) {
      throw new TypeError("Cannot coerce a Signal, use `.value` instead");
    }
  }
  toString() {
    return `[Signal ${String(this.value)}]`;
  }
  toJSON() {
    return { value: this.value };
  }
  get value() {
    if (this[QObjectSignalFlags] & SIGNAL_UNASSIGNED) {
      throw SignalUnassignedException;
    }
    const sub = tryGetInvokeContext()?.$subscriber$;
    if (sub) {
      this[QObjectManagerSymbol].$addSub$(sub);
    }
    return this.untrackedValue;
  }
  set value(v) {
    if (qDev) {
      if (this[QObjectSignalFlags] & SIGNAL_IMMUTABLE) {
        throw new Error("Cannot mutate immutable signal");
      }
      if (qSerialize) {
        verifySerializable(v);
      }
      const invokeCtx = tryGetInvokeContext();
      if (invokeCtx) {
        if (invokeCtx.$event$ === RenderEvent) {
          logWarn(
            "State mutation inside render function. Use useTask$() instead.",
            invokeCtx.$hostElement$,
          );
        } else if (invokeCtx.$event$ === ComputedEvent) {
          logWarn(
            "State mutation inside useComputed$() is an antipattern. Use useTask$() instead",
            invokeCtx.$hostElement$,
          );
        } else if (invokeCtx.$event$ === ResourceEvent) {
          logWarn(
            "State mutation inside useResource$() is an antipattern. Use useTask$() instead",
            invokeCtx.$hostElement$,
          );
        }
      }
    }
    const manager = this[QObjectManagerSymbol];
    const oldValue = this.untrackedValue;
    if (manager && oldValue !== v) {
      this.untrackedValue = v;
      manager.$notifySubs$();
    }
  }
}
class SignalDerived extends SignalBase {
  $func$;
  $args$;
  $funcStr$;
  constructor($func$, $args$, $funcStr$) {
    super();
    this.$func$ = $func$;
    this.$args$ = $args$;
    this.$funcStr$ = $funcStr$;
  }
  get value() {
    return this.$func$.apply(undefined, this.$args$);
  }
}
class SignalWrapper extends SignalBase {
  ref;
  prop;
  constructor(ref, prop) {
    super();
    this.ref = ref;
    this.prop = prop;
  }
  get [QObjectManagerSymbol]() {
    return getSubscriptionManager(this.ref);
  }
  get value() {
    return this.ref[this.prop];
  }
  set value(value) {
    this.ref[this.prop] = value;
  }
}
/**
 * Checks if a given object is a `Signal`.
 *
 * @param obj - The object to check if `Signal`.
 * @returns Boolean - True if the object is a `Signal`.
 * @public
 */
const isSignal = (obj) => {
  return obj instanceof SignalBase;
};
const intToStr = (nu) => {
  return nu.toString(36);
};
const strToInt = (nu) => {
  return parseInt(nu, 36);
};
const mapJoin = (objects, getObjectId, sep) => {
  let output = "";
  for (const obj of objects) {
    const id = getObjectId(obj);
    if (id !== null) {
      if (output !== "") {
        output += sep;
      }
      output += id;
    }
  }
  return output;
};
const collectDeferElement = (el, collector) => {
  const ctx = tryGetContext(el);
  if (collector.$elements$.includes(ctx)) {
    return;
  }
  collector.$elements$.push(ctx);
  if (ctx.$flags$ & HOST_FLAG_DYNAMIC) {
    collector.$prefetch$++;
    collectElementData(ctx, collector, true);
    collector.$prefetch$--;
  } else {
    collector.$deferElements$.push(ctx);
  }
};
const collectElementData = (elCtx, collector, dynamicCtx) => {
  if (elCtx.$props$ && !isEmptyObj(elCtx.$props$)) {
    collectValue(elCtx.$props$, collector, dynamicCtx);
    collectSubscriptions(
      getSubscriptionManager(elCtx.$props$),
      collector,
      dynamicCtx,
    );
  }
  if (elCtx.$componentQrl$) {
    collectValue(elCtx.$componentQrl$, collector, dynamicCtx);
  }
  if (elCtx.$seq$) {
    for (const obj of elCtx.$seq$) {
      collectValue(obj, collector, dynamicCtx);
    }
  }
  if (elCtx.$tasks$) {
    const map = collector.$containerState$.$subsManager$.$groupToManagers$;
    for (const obj of elCtx.$tasks$) {
      if (map.has(obj)) {
        collectValue(obj, collector, dynamicCtx);
      }
    }
  }
  if (dynamicCtx === true) {
    collectContext(elCtx, collector);
    if (elCtx.$dynamicSlots$) {
      for (const slotCtx of elCtx.$dynamicSlots$) {
        collectContext(slotCtx, collector);
      }
    }
  }
};
const collectContext = (elCtx, collector) => {
  while (elCtx) {
    if (elCtx.$contexts$) {
      for (const obj of elCtx.$contexts$.values()) {
        collectValue(obj, collector, true);
      }
    }
    elCtx = elCtx.$parentCtx$;
  }
};
// Collect all the subscribers of this manager
const collectSubscriptions = (manager, collector, leaks) => {
  // if (!leaks) {
  //   return;
  // }
  if (collector.$seen$.has(manager)) {
    return;
  }
  collector.$seen$.add(manager);
  const subs = manager.$subs$;
  assertDefined(subs, "subs must be defined");
  for (const sub of subs) {
    const type = sub[0];
    if (type > 0) {
      collectValue(sub[2], collector, leaks);
    }
    if (leaks === true) {
      const host = sub[1];
      if (isNode$1(host) && isVirtualElement(host)) {
        if (sub[0] === 0) {
          collectDeferElement(host, collector);
        }
      } else {
        collectValue(host, collector, true);
      }
    }
  }
};
const PROMISE_VALUE = Symbol();
const resolvePromise = (promise) => {
  return promise.then(
    (value) => {
      const v = {
        resolved: true,
        value,
      };
      promise[PROMISE_VALUE] = v;
      return value;
    },
    (value) => {
      const v = {
        resolved: false,
        value,
      };
      promise[PROMISE_VALUE] = v;
      return value;
    },
  );
};
const collectValue = (obj, collector, leaks) => {
  if (obj != null) {
    const objType = typeof obj;
    switch (objType) {
      case "function":
      case "object": {
        if (collector.$seen$.has(obj)) {
          return;
        }
        collector.$seen$.add(obj);
        if (fastSkipSerialize(obj)) {
          collector.$objSet$.add(undefined);
          collector.$noSerialize$.push(obj);
          return;
        }
        /** The possibly proxied `obj` */
        const input = obj;
        const target = getProxyTarget(obj);
        if (target) {
          // `obj` is now the non-proxied object
          obj = target;
          // NOTE: You may be tempted to add the `target` to the `seen` set,
          // but that would not work as it is possible for the `target` object
          // to already be in `seen` set if it was passed in directly, so
          // we can't short circuit and need to do the work.
          // Issue: https://github.com/QwikDev/qwik/issues/5001
          const mutable = (getProxyFlags(obj) & QObjectImmutable) === 0;
          if (leaks && mutable) {
            collectSubscriptions(
              getSubscriptionManager(input),
              collector,
              leaks,
            );
          }
          if (fastWeakSerialize(input)) {
            collector.$objSet$.add(obj);
            return;
          }
        }
        const collected = collectDeps(obj, collector, leaks);
        if (collected) {
          collector.$objSet$.add(obj);
          return;
        }
        if (isPromise(obj)) {
          collector.$promises$.push(
            resolvePromise(obj).then((value) => {
              collectValue(value, collector, leaks);
            }),
          );
          return;
        }
        if (objType === "object") {
          if (isNode$1(obj)) {
            return;
          }
          if (isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
              collectValue(input[i], collector, leaks);
            }
          } else if (isSerializableObject(obj)) {
            for (const key in obj) {
              collectValue(input[key], collector, leaks);
            }
          }
        }
        break;
      }
    }
  }
  collector.$objSet$.add(obj);
};
const isEmptyObj = (obj) => {
  return Object.keys(obj).length === 0;
};

// https://regexr.com/68v72
const EXTRACT_IMPORT_PATH = /\(\s*(['"])([^\1]+)\1\s*\)/;
// https://regexr.com/690ds
const EXTRACT_SELF_IMPORT = /Promise\s*\.\s*resolve/;
// https://regexr.com/6a83h
const EXTRACT_FILE_NAME = /[\\/(]([\w\d.\-_]+\.(js|ts)x?):/;
const announcedQRL = /*#__PURE__*/ new Set();
// <docs markdown="../readme.md#qrl">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#qrl instead)
/**
 * Used by Qwik Optimizer to point to lazy-loaded resources.
 *
 * This function should be used by the Qwik Optimizer only. The function should not be directly
 * referred to in the source code of the application.
 *
 * @param chunkOrFn - Chunk name (or function which is stringified to extract chunk name)
 * @param symbol - Symbol to lazy load
 * @param lexicalScopeCapture - A set of lexically scoped variables to capture.
 * @public
 * @see `QRL`, `$(...)`
 */
// </docs>
const qrl = (
  chunkOrFn,
  symbol,
  lexicalScopeCapture = EMPTY_ARRAY,
  stackOffset = 0,
) => {
  let chunk = null;
  let symbolFn = null;
  if (isFunction(chunkOrFn)) {
    symbolFn = chunkOrFn;
    if (qSerialize) {
      let match;
      const srcCode = String(chunkOrFn);
      if ((match = srcCode.match(EXTRACT_IMPORT_PATH)) && match[2]) {
        chunk = match[2];
      } else if ((match = srcCode.match(EXTRACT_SELF_IMPORT))) {
        const ref = "QWIK-SELF";
        const frames = new Error(ref).stack.split("\n");
        const start = frames.findIndex((f) => f.includes(ref));
        const frame = frames[start + 2 + stackOffset];
        match = frame.match(EXTRACT_FILE_NAME);
        if (!match) {
          chunk = "main";
        } else {
          chunk = match[1];
        }
      } else {
        throw qError(QError_dynamicImportFailed, srcCode);
      }
    }
  } else if (isString(chunkOrFn)) {
    chunk = chunkOrFn;
  } else {
    throw qError(QError_unknownTypeArgument, chunkOrFn);
  }
  if (!announcedQRL.has(symbol)) {
    // Emit event
    announcedQRL.add(symbol);
  }
  // Unwrap subscribers
  return createQRL(
    chunk,
    symbol,
    null,
    symbolFn,
    null,
    lexicalScopeCapture,
    null,
  );
};
/** @internal */
const qrlDEV = (chunkOrFn, symbol, opts, lexicalScopeCapture = EMPTY_ARRAY) => {
  const newQrl = qrl(chunkOrFn, symbol, lexicalScopeCapture, 1);
  newQrl.dev = opts;
  return newQrl;
};
const serializeQRL = (qrl, opts = {}) => {
  assertTrue(
    qSerialize,
    "In order to serialize a QRL, qSerialize must be true",
  );
  assertQrl(qrl);
  let symbol = qrl.$symbol$;
  let chunk = qrl.$chunk$;
  const refSymbol = qrl.$refSymbol$ ?? symbol;
  const platform = getPlatform();
  if (platform) {
    const result = platform.chunkForSymbol(refSymbol, chunk, qrl.dev?.file);
    if (result) {
      chunk = result[1];
      if (!qrl.$refSymbol$) {
        symbol = result[0];
      }
    } else {
      console.error(
        "serializeQRL: Cannot resolve symbol",
        symbol,
        "in",
        chunk,
        qrl.dev?.file,
      );
    }
  }
  if (qRuntimeQrl && chunk == null) {
    chunk = "/runtimeQRL";
    symbol = "_";
  }
  if (chunk == null) {
    throw qError(QError_qrlMissingChunk, qrl.$symbol$);
  }
  if (chunk.startsWith("./")) {
    chunk = chunk.slice(2);
  }
  if (isSyncQrl(qrl)) {
    if (opts.$containerState$) {
      const fn = qrl.resolved;
      const containerState = opts.$containerState$;
      const fnStrKey = fn.serialized || fn.toString();
      let id = containerState.$inlineFns$.get(fnStrKey);
      if (id === undefined) {
        id = containerState.$inlineFns$.size;
        containerState.$inlineFns$.set(fnStrKey, id);
      }
      symbol = String(id);
    } else {
      throwErrorAndStop("Sync QRL without containerState");
    }
  }
  let output = `${chunk}#${symbol}`;
  const capture = qrl.$capture$;
  const captureRef = qrl.$captureRef$;
  if (captureRef && captureRef.length) {
    if (opts.$getObjId$) {
      output += `[${mapJoin(captureRef, opts.$getObjId$, " ")}]`;
    } else if (opts.$addRefMap$) {
      output += `[${mapJoin(captureRef, opts.$addRefMap$, " ")}]`;
    }
  } else if (capture && capture.length > 0) {
    output += `[${capture.join(" ")}]`;
  }
  return output;
};
/** `./chunk#symbol[captures] */
const parseQRL = (qrl, containerEl) => {
  const endIdx = qrl.length;
  const hashIdx = indexOf(qrl, 0, "#");
  const captureIdx = indexOf(qrl, hashIdx, "[");
  const chunkEndIdx = Math.min(hashIdx, captureIdx);
  const chunk = qrl.substring(0, chunkEndIdx);
  const symbolStartIdx = hashIdx == endIdx ? hashIdx : hashIdx + 1;
  const symbolEndIdx = captureIdx;
  const symbol =
    symbolStartIdx == symbolEndIdx
      ? "default"
      : qrl.substring(symbolStartIdx, symbolEndIdx);
  const captureStartIdx = captureIdx;
  const captureEndIdx = endIdx;
  const capture =
    captureStartIdx === captureEndIdx
      ? EMPTY_ARRAY
      : qrl.substring(captureStartIdx + 1, captureEndIdx - 1).split(" ");
  const iQrl = createQRL(chunk, symbol, null, null, capture, null, null);
  if (containerEl) {
    iQrl.$setContainer$(containerEl);
  }
  return iQrl;
};
const indexOf = (text, startIdx, char) => {
  const endIdx = text.length;
  const charIdx = text.indexOf(char, startIdx == endIdx ? 0 : startIdx);
  return charIdx == -1 ? endIdx : charIdx;
};
const _createResourceReturn = (opts) => {
  const resource = {
    __brand: "resource",
    value: undefined,
    loading: isServerPlatform() ? false : true,
    _resolved: undefined,
    _error: undefined,
    _state: "pending",
    _timeout: opts?.timeout ?? -1,
    _cache: 0,
  };
  return resource;
};
const isResourceReturn = (obj) => {
  return isObject(obj) && obj.__brand === "resource";
};
const serializeResource = (resource, getObjId) => {
  const state = resource._state;
  if (state === "resolved") {
    return `0 ${getObjId(resource._resolved)}`;
  } else if (state === "pending") {
    return `1`;
  } else {
    return `2 ${getObjId(resource._error)}`;
  }
};
const parseResourceReturn = (data) => {
  const [first, id] = data.split(" ");
  const result = _createResourceReturn(undefined);
  result.value = Promise.resolve();
  if (first === "0") {
    result._state = "resolved";
    result._resolved = id;
    result.loading = false;
  } else if (first === "1") {
    result._state = "pending";
    result.value = new Promise(() => {});
    result.loading = true;
  } else if (first === "2") {
    result._state = "rejected";
    result._error = id;
    result.loading = false;
  }
  return result;
};

/**
 * Allows to project the children of the current component. `<Slot/>` can only be used within the
 * context of a component defined with `component$`.
 *
 * @public
 */
const Slot = (props) => {
  return _jsxC(
    Virtual,
    {
      [QSlotS]: "",
    },
    0,
    props.name ?? "",
  );
};

/**
 * - 0, 8, 9, A, B, C, D
 * - `\0`: null character (U+0000 NULL) (only if the next character is not a decimal digit; else it’s
 *   an octal escape sequence)
 * - `\b`: backspace (U+0008 BACKSPACE)
 * - `\t`: horizontal tab (U+0009 CHARACTER TABULATION)
 * - `\n`: line feed (U+000A LINE FEED)
 * - `\v`: vertical tab (U+000B LINE TABULATION)
 * - `\f`: form feed (U+000C FORM FEED)
 * - `\r`: carriage return (U+000D CARRIAGE RETURN)
 * - `\"`: double quote (U+0022 QUOTATION MARK)
 * - `\'`: single quote (U+0027 APOSTROPHE)
 * - `\\`: backslash (U+005C REVERSE SOLIDUS)
 */
const UNDEFINED_PREFIX = "\u0001";
/**
 * Normalize the shape of the serializer for better inline-cache performance.
 *
 * @param serializer
 * @returns
 */
function serializer(serializer) {
  return {
    $prefixCode$: serializer.$prefix$.charCodeAt(0),
    $prefixChar$: serializer.$prefix$,
    $test$: serializer.$test$,
    $serialize$: serializer.$serialize$,
    $prepare$: serializer.$prepare$,
    $fill$: serializer.$fill$,
    $collect$: serializer.$collect$,
    $subs$: serializer.$subs$,
  };
}
const QRLSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0002",
  $test$: (v) => isQrl(v),
  $collect$: (v, collector, leaks) => {
    if (v.$captureRef$) {
      for (const item of v.$captureRef$) {
        collectValue(item, collector, leaks);
      }
    }
    if (collector.$prefetch$ === 0) {
      collector.$qrls$.push(v);
    }
  },
  $serialize$: (obj, getObjId) => {
    return serializeQRL(obj, {
      $getObjId$: getObjId,
    });
  },
  $prepare$: (data, containerState) => {
    return parseQRL(data, containerState.$containerEl$);
  },
  $fill$: (qrl, getObject) => {
    if (qrl.$capture$ && qrl.$capture$.length > 0) {
      qrl.$captureRef$ = qrl.$capture$.map(getObject);
      qrl.$capture$ = null;
    }
  },
});
const TaskSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0003",
  $test$: (v) => isSubscriberDescriptor(v),
  $collect$: (v, collector, leaks) => {
    collectValue(v.$qrl$, collector, leaks);
    if (v.$state$) {
      collectValue(v.$state$, collector, leaks);
      if (leaks === true && v.$state$ instanceof SignalImpl) {
        collectSubscriptions(v.$state$[QObjectManagerSymbol], collector, true);
      }
    }
  },
  $serialize$: (obj, getObjId) => serializeTask(obj, getObjId),
  $prepare$: (data) => parseTask(data),
  $fill$: (task, getObject) => {
    task.$el$ = getObject(task.$el$);
    task.$qrl$ = getObject(task.$qrl$);
    if (task.$state$) {
      task.$state$ = getObject(task.$state$);
    }
  },
});
const ResourceSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0004",
  $test$: (v) => isResourceReturn(v),
  $collect$: (obj, collector, leaks) => {
    collectValue(obj.value, collector, leaks);
    collectValue(obj._resolved, collector, leaks);
  },
  $serialize$: (obj, getObjId) => {
    return serializeResource(obj, getObjId);
  },
  $prepare$: (data) => {
    return parseResourceReturn(data);
  },
  $fill$: (resource, getObject) => {
    if (resource._state === "resolved") {
      resource._resolved = getObject(resource._resolved);
      resource.value = Promise.resolve(resource._resolved);
    } else if (resource._state === "rejected") {
      const p = Promise.reject(resource._error);
      p.catch(() => null);
      resource._error = getObject(resource._error);
      resource.value = p;
    }
  },
});
const URLSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0005",
  $test$: (v) => v instanceof URL,
  $serialize$: (obj) => obj.href,
  $prepare$: (data) => new URL(data),
});
const DateSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0006",
  $test$: (v) => v instanceof Date,
  $serialize$: (obj) => obj.toISOString(),
  $prepare$: (data) => new Date(data),
});
const RegexSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0007",
  $test$: (v) => v instanceof RegExp,
  $serialize$: (obj) => `${obj.flags} ${obj.source}`,
  $prepare$: (data) => {
    const space = data.indexOf(" ");
    const source = data.slice(space + 1);
    const flags = data.slice(0, space);
    return new RegExp(source, flags);
  },
});
const ErrorSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u000E",
  $test$: (v) => v instanceof Error,
  $serialize$: (obj) => {
    return obj.message;
  },
  $prepare$: (text) => {
    const err = new Error(text);
    err.stack = undefined;
    return err;
  },
});
const DocumentSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u000F",
  $test$: (v) => !!v && typeof v === "object" && isDocument(v),
  $prepare$: (_, _c, doc) => {
    return doc;
  },
});
const SERIALIZABLE_STATE = Symbol("serializable-data");
const ComponentSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0010",
  $test$: (obj) => isQwikComponent(obj),
  $serialize$: (obj, getObjId) => {
    const [qrl] = obj[SERIALIZABLE_STATE];
    return serializeQRL(qrl, {
      $getObjId$: getObjId,
    });
  },
  $prepare$: (data, containerState) => {
    const qrl = parseQRL(data, containerState.$containerEl$);
    return componentQrl(qrl);
  },
  $fill$: (component, getObject) => {
    const [qrl] = component[SERIALIZABLE_STATE];
    if (qrl.$capture$?.length) {
      qrl.$captureRef$ = qrl.$capture$.map(getObject);
      qrl.$capture$ = null;
    }
  },
});
const DerivedSignalSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0011",
  $test$: (obj) => obj instanceof SignalDerived,
  $collect$: (obj, collector, leaks) => {
    if (obj.$args$) {
      for (const arg of obj.$args$) {
        collectValue(arg, collector, leaks);
      }
    }
  },
  $serialize$: (signal, getObjID, collector) => {
    const serialized = serializeDerivedSignalFunc(signal);
    let index = collector.$inlinedFunctions$.indexOf(serialized);
    if (index < 0) {
      index = collector.$inlinedFunctions$.length;
      collector.$inlinedFunctions$.push(serialized);
    }
    return mapJoin(signal.$args$, getObjID, " ") + " @" + intToStr(index);
  },
  $prepare$: (data) => {
    const ids = data.split(" ");
    const args = ids.slice(0, -1);
    const fn = ids[ids.length - 1];
    return new SignalDerived(fn, args, fn);
  },
  $fill$: (fn, getObject) => {
    assertString(fn.$func$, "fn.$func$ should be a string");
    fn.$func$ = getObject(fn.$func$);
    fn.$args$ = fn.$args$.map(getObject);
  },
});
const SignalSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0012",
  $test$: (v) => v instanceof SignalImpl,
  $collect$: (obj, collector, leaks) => {
    collectValue(obj.untrackedValue, collector, leaks);
    const mutable = (obj[QObjectSignalFlags] & SIGNAL_IMMUTABLE) === 0;
    if (leaks === true && mutable) {
      collectSubscriptions(obj[QObjectManagerSymbol], collector, true);
    }
    return obj;
  },
  $serialize$: (obj, getObjId) => {
    return getObjId(obj.untrackedValue);
  },
  $prepare$: (data, containerState) => {
    return new SignalImpl(
      data,
      containerState?.$subsManager$?.$createManager$(),
      0,
    );
  },
  $subs$: (signal, subs) => {
    signal[QObjectManagerSymbol].$addSubs$(subs);
  },
  $fill$: (signal, getObject) => {
    signal.untrackedValue = getObject(signal.untrackedValue);
  },
});
const SignalWrapperSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0013",
  $test$: (v) => v instanceof SignalWrapper,
  $collect$(obj, collector, leaks) {
    collectValue(obj.ref, collector, leaks);
    if (fastWeakSerialize(obj.ref)) {
      const localManager = getSubscriptionManager(obj.ref);
      if (
        isTreeShakeable(
          collector.$containerState$.$subsManager$,
          localManager,
          leaks,
        )
      ) {
        collectValue(obj.ref[obj.prop], collector, leaks);
      }
    }
    return obj;
  },
  $serialize$: (obj, getObjId) => {
    return `${getObjId(obj.ref)} ${obj.prop}`;
  },
  $prepare$: (data) => {
    const [id, prop] = data.split(" ");
    return new SignalWrapper(id, prop);
  },
  $fill$: (signal, getObject) => {
    signal.ref = getObject(signal.ref);
  },
});
const NoFiniteNumberSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0014",
  $test$: (v) => typeof v === "number",
  $serialize$: (v) => {
    return String(v);
  },
  $prepare$: (data) => {
    return Number(data);
  },
});
const URLSearchParamsSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0015",
  $test$: (v) => v instanceof URLSearchParams,
  $serialize$: (obj) => obj.toString(),
  $prepare$: (data) => new URLSearchParams(data),
});
const FormDataSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0016",
  $test$: (v) =>
    typeof FormData !== "undefined" && v instanceof globalThis.FormData,
  $serialize$: (formData) => {
    const array = [];
    formData.forEach((value, key) => {
      if (typeof value === "string") {
        array.push([key, value]);
      } else {
        array.push([key, value.name]);
      }
    });
    return JSON.stringify(array);
  },
  $prepare$: (data) => {
    const array = JSON.parse(data);
    const formData = new FormData();
    for (const [key, value] of array) {
      formData.append(key, value);
    }
    return formData;
  },
});
const JSXNodeSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0017",
  $test$: (v) => isJSXNode(v),
  $collect$: (node, collector, leaks) => {
    collectValue(node.children, collector, leaks);
    collectValue(node.props, collector, leaks);
    collectValue(node.immutableProps, collector, leaks);
    collectValue(node.key, collector, leaks);
    let type = node.type;
    if (type === Slot) {
      type = ":slot";
    } else if (type === Fragment) {
      type = ":fragment";
    }
    collectValue(type, collector, leaks);
  },
  $serialize$: (node, getObjID) => {
    let type = node.type;
    if (type === Slot) {
      type = ":slot";
    } else if (type === Fragment) {
      type = ":fragment";
    }
    return `${getObjID(type)} ${getObjID(node.props)} ${getObjID(node.immutableProps)} ${getObjID(node.key)} ${getObjID(node.children)} ${node.flags}`;
  },
  $prepare$: (data) => {
    const [type, props, immutableProps, key, children, flags] = data.split(" ");
    const node = new JSXNodeImpl(
      type,
      props,
      immutableProps,
      children,
      parseInt(flags, 10),
      key,
    );
    return node;
  },
  $fill$: (node, getObject) => {
    node.type = getResolveJSXType(getObject(node.type));
    node.props = getObject(node.props);
    node.immutableProps = getObject(node.immutableProps);
    node.key = getObject(node.key);
    node.children = getObject(node.children);
  },
});
const BigIntSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0018",
  $test$: (v) => typeof v === "bigint",
  $serialize$: (v) => {
    return v.toString();
  },
  $prepare$: (data) => {
    return BigInt(data);
  },
});
const Uint8ArraySerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u001c",
  $test$: (v) => v instanceof Uint8Array,
  $serialize$: (v) => {
    let buf = "";
    for (const c of v) {
      buf += String.fromCharCode(c);
    }
    return btoa(buf).replace(/=+$/, "");
  },
  $prepare$: (data) => {
    const buf = atob(data);
    const bytes = new Uint8Array(buf.length);
    let i = 0;
    for (const s of buf) {
      bytes[i++] = s.charCodeAt(0);
    }
    return bytes;
  },
  $fill$: undefined,
});
const DATA = Symbol();
const SetSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u0019",
  $test$: (v) => v instanceof Set,
  $collect$: (set, collector, leaks) => {
    set.forEach((value) => collectValue(value, collector, leaks));
  },
  $serialize$: (v, getObjID) => {
    return Array.from(v).map(getObjID).join(" ");
  },
  $prepare$: (data) => {
    const set = new Set();
    set[DATA] = data;
    return set;
  },
  $fill$: (set, getObject) => {
    const data = set[DATA];
    set[DATA] = undefined;
    assertString(data, "SetSerializer should be defined");
    const items = data.length === 0 ? [] : data.split(" ");
    for (const id of items) {
      set.add(getObject(id));
    }
  },
});
const MapSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u001a",
  $test$: (v) => v instanceof Map,
  $collect$: (map, collector, leaks) => {
    map.forEach((value, key) => {
      collectValue(value, collector, leaks);
      collectValue(key, collector, leaks);
    });
  },
  $serialize$: (map, getObjID) => {
    const result = [];
    map.forEach((value, key) => {
      result.push(getObjID(key) + " " + getObjID(value));
    });
    return result.join(" ");
  },
  $prepare$: (data) => {
    const set = new Map();
    set[DATA] = data;
    return set;
  },
  $fill$: (set, getObject) => {
    const data = set[DATA];
    set[DATA] = undefined;
    assertString(data, "SetSerializer should be defined");
    const items = data.length === 0 ? [] : data.split(" ");
    assertTrue(
      items.length % 2 === 0,
      "MapSerializer should have even number of items",
    );
    for (let i = 0; i < items.length; i += 2) {
      set.set(getObject(items[i]), getObject(items[i + 1]));
    }
  },
});
const StringSerializer = /*#__PURE__*/ serializer({
  $prefix$: "\u001b",
  $test$: (v) => !!getSerializer(v) || v === UNDEFINED_PREFIX,
  $serialize$: (v) => v,
  $prepare$: (data) => data,
});
const serializers = [
  // NULL                       \u0000
  // UNDEFINED_PREFIX           \u0001
  QRLSerializer, ////////////// \u0002
  TaskSerializer, ///////////// \u0003
  ResourceSerializer, ///////// \u0004
  URLSerializer, ////////////// \u0005
  DateSerializer, ///////////// \u0006
  RegexSerializer, //////////// \u0007
  // BACKSPACE                  \u0008
  // HORIZONTAL TAB             \u0009
  // NEW LINE                   \u000A
  // VERTICAL TAB               \u000B
  // FORM FEED                  \u000C
  // CARRIAGE RETURN            \u000D
  ErrorSerializer, //////////// \u000E
  DocumentSerializer, ///////// \u000F
  ComponentSerializer, //////// \u0010
  DerivedSignalSerializer, //// \u0011
  SignalSerializer, /////////// \u0012
  SignalWrapperSerializer, //// \u0013
  NoFiniteNumberSerializer, /// \u0014
  URLSearchParamsSerializer, // \u0015
  FormDataSerializer, ///////// \u0016
  JSXNodeSerializer, ////////// \u0017
  BigIntSerializer, /////////// \u0018
  SetSerializer, ////////////// \u0019
  MapSerializer, ////////////// \u001a
  StringSerializer, /////////// \u001b
  Uint8ArraySerializer, /////// \u001c
];
const serializerByPrefix = /*#__PURE__*/ (() => {
  const serializerByPrefix = [];
  serializers.forEach((s) => {
    const prefix = s.$prefixCode$;
    while (serializerByPrefix.length < prefix) {
      serializerByPrefix.push(undefined);
    }
    serializerByPrefix.push(s);
  });
  return serializerByPrefix;
})();
function getSerializer(obj) {
  if (typeof obj === "string") {
    const prefix = obj.charCodeAt(0);
    if (prefix < serializerByPrefix.length) {
      return serializerByPrefix[prefix];
    }
  }
  return undefined;
}
const collectorSerializers = /*#__PURE__*/ serializers.filter(
  (a) => a.$collect$,
);
const canSerialize = (obj) => {
  for (const s of serializers) {
    if (s.$test$(obj)) {
      return true;
    }
  }
  return false;
};
const collectDeps = (obj, collector, leaks) => {
  for (const s of collectorSerializers) {
    if (s.$test$(obj)) {
      s.$collect$(obj, collector, leaks);
      return true;
    }
  }
  return false;
};
const isTreeShakeable = (manager, target, leaks) => {
  if (typeof leaks === "boolean") {
    return leaks;
  }
  const localManager = manager.$groupToManagers$.get(leaks);
  if (localManager && localManager.length > 0) {
    if (localManager.length === 1) {
      return localManager[0] !== target;
    }
    return true;
  }
  return false;
};
const getResolveJSXType = (type) => {
  if (type === ":slot") {
    return Slot;
  }
  if (type === ":fragment") {
    return Fragment;
  }
  return type;
};

/** @internal */
const verifySerializable = (value, preMessage) => {
  const seen = new Set();
  return _verifySerializable(value, seen, "_", preMessage);
};
const _verifySerializable = (value, seen, ctx, preMessage) => {
  const unwrapped = unwrapProxy(value);
  if (unwrapped == null) {
    return value;
  }
  if (shouldSerialize(unwrapped)) {
    if (seen.has(unwrapped)) {
      return value;
    }
    seen.add(unwrapped);
    if (canSerialize(unwrapped)) {
      return value;
    }
    const typeObj = typeof unwrapped;
    switch (typeObj) {
      case "object":
        if (isPromise(unwrapped)) {
          return value;
        }
        if (isNode$1(unwrapped)) {
          return value;
        }
        if (isArray(unwrapped)) {
          let expectIndex = 0;
          // Make sure the array has no holes
          unwrapped.forEach((v, i) => {
            if (i !== expectIndex) {
              throw qError(QError_verifySerializable, unwrapped);
            }
            _verifySerializable(v, seen, ctx + "[" + i + "]");
            expectIndex = i + 1;
          });
          return value;
        }
        if (isSerializableObject(unwrapped)) {
          for (const [key, item] of Object.entries(unwrapped)) {
            _verifySerializable(item, seen, ctx + "." + key);
          }
          return value;
        }
        break;
      case "boolean":
      case "string":
      case "number":
        return value;
    }
    let message = "";
    if (preMessage) {
      message = preMessage;
    } else {
      message = "Value cannot be serialized";
    }
    if (ctx !== "_") {
      message += ` in ${ctx},`;
    }
    if (typeObj === "object") {
      message += ` because it's an instance of "${value?.constructor.name}". You might need to use 'noSerialize()' or use an object literal instead. Check out https://qwik.dev/docs/advanced/dollar/`;
    } else if (typeObj === "function") {
      const fnName = value.name;
      message += ` because it's a function named "${fnName}". You might need to convert it to a QRL using $(fn):\n\nconst ${fnName} = $(${String(value)});\n\nPlease check out https://qwik.dev/docs/advanced/qrl/ for more information.`;
    }
    console.error("Trying to serialize", value);
    throwErrorAndStop(message);
  }
  return value;
};
const noSerializeSet = /*#__PURE__*/ new WeakSet();
const weakSerializeSet = /*#__PURE__*/ new WeakSet();
const shouldSerialize = (obj) => {
  if (isObject(obj) || isFunction(obj)) {
    return !noSerializeSet.has(obj);
  }
  return true;
};
const fastSkipSerialize = (obj) => {
  return noSerializeSet.has(obj);
};
const fastWeakSerialize = (obj) => {
  return weakSerializeSet.has(obj);
};
/**
 * Get the target value of the Proxy. Useful if you want to clone a store (structureClone,
 * IndexedDB,...)
 *
 * @public
 */
const unwrapProxy = (proxy) => {
  return isObject(proxy) ? getProxyTarget(proxy) ?? proxy : proxy;
};
const getProxyTarget = (obj) => {
  return obj[QOjectTargetSymbol];
};
const getSubscriptionManager = (obj) => {
  return obj[QObjectManagerSymbol];
};
const getProxyFlags = (obj) => {
  return obj[QObjectFlagsSymbol];
};

const isQrl = (value) => {
  return typeof value === "function" && typeof value.getSymbol === "function";
};
// Make sure this value is same as value in `platform.ts`
const SYNC_QRL = "<sync>";
/** Sync QRL is a function which is serialized into `<script q:func="qwik/json">` tag. */
const isSyncQrl = (value) => {
  return isQrl(value) && value.$symbol$ == SYNC_QRL;
};
const createQRL = (
  chunk,
  symbol,
  symbolRef,
  symbolFn,
  capture,
  captureRef,
  refSymbol,
) => {
  if (qDev && qSerialize) {
    if (captureRef) {
      for (const item of captureRef) {
        verifySerializable(
          item,
          "Captured variable in the closure can not be serialized",
        );
      }
    }
  }
  let _containerEl;
  const qrl = async function (...args) {
    const fn = invokeFn.call(this, tryGetInvokeContext());
    const result = await fn(...args);
    return result;
  };
  const setContainer = (el) => {
    if (!_containerEl) {
      _containerEl = el;
    }
    return _containerEl;
  };
  // Wrap functions to provide their lexical scope
  const wrapFn = (fn) => {
    if (typeof fn !== "function" || (!capture?.length && !captureRef?.length)) {
      return fn;
    }
    return function (...args) {
      let context = tryGetInvokeContext();
      if (context) {
        const prevQrl = context.$qrl$;
        context.$qrl$ = qrl;
        const prevEvent = context.$event$;
        if (context.$event$ === undefined) {
          context.$event$ = this;
        }
        try {
          return fn.apply(this, args);
        } finally {
          context.$qrl$ = prevQrl;
          context.$event$ = prevEvent;
        }
      }
      context = newInvokeContext();
      context.$qrl$ = qrl;
      context.$event$ = this;
      return invoke.call(this, context, fn, ...args);
    };
  };
  const resolve = async (containerEl) => {
    if (symbolRef !== null) {
      // Resolving (Promise) or already resolved (value)
      return symbolRef;
    }
    if (containerEl) {
      setContainer(containerEl);
    }
    if (chunk === "") {
      // Sync QRL
      assertDefined(_containerEl, "Sync QRL must have container element");
      const hash = _containerEl.getAttribute(QInstance);
      const doc = _containerEl.ownerDocument;
      const qFuncs = getQFuncs(doc, hash);
      // No need to wrap, syncQRLs can't have captured scope
      return (qrl.resolved = symbolRef = qFuncs[Number(symbol)]);
    }
    if (chunk) {
      /** We run the QRL, so now the probability of the chunk is 100% */
      preload(chunk, 1);
    }
    const start = now();
    const ctx = tryGetInvokeContext();
    if (symbolFn !== null) {
      symbolRef = symbolFn().then(
        (module) => (qrl.resolved = symbolRef = wrapFn(module[symbol])),
      );
    } else {
      const imported = getPlatform().importSymbol(_containerEl, chunk, symbol);
      symbolRef = maybeThen(
        imported,
        (ref) => (qrl.resolved = symbolRef = wrapFn(ref)),
      );
    }
    if (typeof symbolRef === "object" && isPromise(symbolRef)) {
      symbolRef.then(
        () => emitUsedSymbol(symbol, ctx?.$element$, start),
        (err) => {
          console.error(`qrl ${symbol} failed to load`, err);
          // We shouldn't cache rejections, we can try again later
          symbolRef = null;
        },
      );
    }
    return symbolRef;
  };
  const resolveLazy = (containerEl) => {
    return symbolRef !== null ? symbolRef : resolve(containerEl);
  };
  function invokeFn(currentCtx, beforeFn) {
    // Note that we bind the current `this`
    return (...args) =>
      maybeThen(resolveLazy(), (f) => {
        if (!isFunction(f)) {
          throw qError(QError_qrlIsNotFunction);
        }
        if (beforeFn && beforeFn() === false) {
          return;
        }
        const context = createOrReuseInvocationContext(currentCtx);
        return invoke.call(this, context, f, ...args);
      });
  }
  const createOrReuseInvocationContext = (invoke) => {
    if (invoke == null) {
      return newInvokeContext();
    } else if (isArray(invoke)) {
      return newInvokeContextFromTuple(invoke);
    } else {
      return invoke;
    }
  };
  const resolvedSymbol = refSymbol ?? symbol;
  const hash = getSymbolHash(resolvedSymbol);
  Object.assign(qrl, {
    getSymbol: () => resolvedSymbol,
    getHash: () => hash,
    getCaptured: () => captureRef,
    resolve,
    $resolveLazy$: resolveLazy,
    $setContainer$: setContainer,
    $chunk$: chunk,
    $symbol$: symbol,
    $refSymbol$: refSymbol,
    $hash$: hash,
    getFn: invokeFn,
    $capture$: capture,
    $captureRef$: captureRef,
    dev: null,
    resolved: undefined,
  });
  if (symbolRef) {
    // Replace symbolRef with (a promise for) the value or wrapped function
    symbolRef = maybeThen(
      symbolRef,
      (resolved) => (qrl.resolved = symbolRef = wrapFn(resolved)),
    );
  }
  if (qDev) {
    seal(qrl);
  }
  if (resolvedSymbol) {
    /**
     * Preloading the symbol instead of the chunk allows us to get probabilities for the bundle
     * based on its contents.
     */
    preload(resolvedSymbol, 0.8);
  }
  return qrl;
};
const getSymbolHash = (symbolName) => {
  const index = symbolName.lastIndexOf("_");
  if (index > -1) {
    return symbolName.slice(index + 1);
  }
  return symbolName;
};
function assertQrl(qrl) {
  if (qDev) {
    if (!isQrl(qrl)) {
      throw new Error("Not a QRL");
    }
  }
}
const EMITTED = /*#__PURE__*/ new Set();
const emitUsedSymbol = (symbol, element, reqTime) => {
  if (!EMITTED.has(symbol)) {
    EMITTED.add(symbol);
    emitEvent("qsymbol", {
      symbol,
      element,
      reqTime,
    });
  }
};
const emitEvent = (eventName, detail) => {
  if (!qTest && !isServerPlatform() && typeof document === "object") {
    document.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: false,
        detail,
      }),
    );
  }
};
const now = () => {
  if (qTest || isServerPlatform()) {
    return 0;
  }
  if (typeof performance === "object") {
    return performance.now();
  }
  return 0;
};

// <docs markdown="../readme.md#component">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#component instead)
/**
 * Declare a Qwik component that can be used to create UI.
 *
 * Use `component$` to declare a Qwik component. A Qwik component is a special kind of component
 * that allows the Qwik framework to lazy load and execute the component independently of other Qwik
 * components as well as lazy load the component's life-cycle hooks and event handlers.
 *
 * Side note: You can also declare regular (standard JSX) components that will have standard
 * synchronous behavior.
 *
 * Qwik component is a facade that describes how the component should be used without forcing the
 * implementation of the component to be eagerly loaded. A minimum Qwik definition consists of:
 *
 * ### Example
 *
 * An example showing how to create a counter component:
 *
 * ```tsx
 * export interface CounterProps {
 *   initialValue?: number;
 *   step?: number;
 * }
 * export const Counter = component$((props: CounterProps) => {
 *   const state = useStore({ count: props.initialValue || 0 });
 *   return (
 *     <div>
 *       <span>{state.count}</span>
 *       <button onClick$={() => (state.count += props.step || 1)}>+</button>
 *     </div>
 *   );
 * });
 * ```
 *
 * - `component$` is how a component gets declared.
 * - `{ value?: number; step?: number }` declares the public (props) interface of the component.
 * - `{ count: number }` declares the private (state) interface of the component.
 *
 * The above can then be used like so:
 *
 * ```tsx
 * export const OtherComponent = component$(() => {
 *   return <Counter initialValue={100} />;
 * });
 * ```
 *
 * See also: `component`, `useCleanup`, `onResume`, `onPause`, `useOn`, `useOnDocument`,
 * `useOnWindow`, `useStyles`
 *
 * @public
 */
// </docs>
const componentQrl = (componentQrl) => {
  // Return a QComponent Factory function.
  function QwikComponent(props, key, flags) {
    assertQrl(componentQrl);
    assertNumber(flags, "The Qwik Component was not invoked correctly");
    const hash = qTest ? "sX" : componentQrl.$hash$.slice(0, 4);
    const finalKey = hash + ":" + (key ? key : "");
    return _jsxC(
      Virtual,
      {
        [OnRenderProp]: componentQrl,
        [QSlot]: props[QSlot],
        [_IMMUTABLE]: props[_IMMUTABLE],
        children: props.children,
        props,
      },
      flags,
      finalKey,
    );
  }
  QwikComponent[SERIALIZABLE_STATE] = [componentQrl];
  return QwikComponent;
};
const isQwikComponent = (component) => {
  return (
    typeof component == "function" &&
    component[SERIALIZABLE_STATE] !== undefined
  );
};

const fixRemotePathsInDevMode = (rawHtml, base = "") => {
  let html = rawHtml;
  if (import.meta.env.DEV) {
    html = html.replace(/q:base="\/(\w+)\/build\/"/gm, (match, child) => {
      base = "/" + child;
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
  return {
    html,
    base,
  };
};
const fixErroredHostClash = (html, base) =>
  html
    .replace(/ErroredHost/gm, `ErroredHost${base.replace("/", "")}`)
    .replace(/errored-host/gm, `errored-host-${base.replace("/", "")}`);
const fixImageWarningClash = (html, base) =>
  html.replace(/image-warning/gm, `image-warning-${base.replace("/", "")}`);
const remotes = {
  home: {
    name: "home",
    url: "http://localhost:4174/home/",
  },
  checkout: {
    name: "checkout",
    url: "http://localhost:4175/checkout/",
  },
};
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
    while (!fragmentChunk.done) {
      const rawHtml = decoder.decode(fragmentChunk.value);
      const fixedHtmlObj = fixRemotePathsInDevMode(rawHtml, base);
      base = fixedHtmlObj.base;
      stream.write(fixedHtmlObj.html);
      fragmentChunk = await reader.read();
    }
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

export {
  app as a,
  app_component_Ncbm0Trxwgc as b,
  fixRemotePathsInDevMode as f,
  parseBundleGraph as g,
  handleBundle as h,
  loadBundleGraph as l,
  preload as p,
  remotes as r,
};
