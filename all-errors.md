Total messages: 4 (Errors: 0, Warnings: 0)
Returning 14 messages for level "error"

[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) @ http://localhost:3000/api/meetings/orb-abcd-efgh:0
[ERROR] Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (http://localhost:3000/_next/static/chunks/src_16uh4jo._.js:159:325)
    at RoomGate (http://localhost:3000/_next/static/chunks/src_1y-5fn4._.js:6672:346)
    at RoomPage (http://localhost:3000/_next/static/chunks/src_1y-5fn4._.js:6995:329)
    at MeetingRoomPage (http://localhost:3000/_next/static/chunks/src_1y-5fn4._.js:40:332)
    at ClientPageRoot (http://localhost:3000/_next/static/chunks/node_modules__pnpm_1hx0o7t._.js:7249:46) @ http://localhost:3000/_next/static/chunks/0iv1_next_dist_07h4_bo._.js:1052
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) @ http://localhost:3000/api/meetings/orb-abcd-efgh:0
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) @ http://localhost:3000/api/meetings/orb-abcd-efgh:0
[ERROR] Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client. Consider using template tag instead (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template). @ http://localhost:3000/_next/static/chunks/0iv1_next_dist_07h4_bo._.js:1052
[ERROR] Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (http://localhost:3000/_next/static/chunks/src_16uh4jo._.js:159:325)
    at DashboardHomePage (http://localhost:3000/_next/static/chunks/src_0hs4v8l._.js:341:347)
    at ClientPageRoot (http://localhost:3000/_next/static/chunks/node_modules__pnpm_1hx0o7t._.js:7249:46) @ http://localhost:3000/_next/static/chunks/0iv1_next_dist_07h4_bo._.js:1052
[ERROR] Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (http://localhost:3000/_next/static/chunks/src_16uh4jo._.js:159:325)
    at DashboardHomePage (http://localhost:3000/_next/static/chunks/src_0hs4v8l._.js:412:347)
    at ClientPageRoot (http://localhost:3000/_next/static/chunks/node_modules__pnpm_1hx0o7t._.js:7249:46) @ http://localhost:3000/_next/static/chunks/0iv1_next_dist_07h4_bo._.js:1052
[ERROR] WebSocket connection to 'ws://localhost:3000/_next/hmr?id=96WH4UMd539_-U4maDgRq' failed: Error in connection establishment: net::ERR_CONNECTION_REFUSED @ http://localhost:3000/_next/static/chunks/0iv1_next_dist_client_0efcvj0._.js:16256
[ERROR] Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client. Consider using template tag instead (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template). @ http://localhost:3000/_next/static/chunks/0iv1_next_dist_07h4_bo._.js:1052
[ERROR] Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (http://localhost:3000/_next/static/chunks/src_16uh4jo._.js:159:325)
    at DashboardHomePage (http://localhost:3000/_next/static/chunks/src_0hs4v8l._.js:341:347)
    at ClientPageRoot (http://localhost:3000/_next/static/chunks/node_modules__pnpm_1hx0o7t._.js:7249:46) @ http://localhost:3000/_next/static/chunks/0iv1_next_dist_07h4_bo._.js:1052
[ERROR] Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (http://localhost:3000/_next/static/chunks/src_16uh4jo._.js:159:325)
    at DashboardHomePage (http://localhost:3000/_next/static/chunks/src_0hs4v8l._.js:412:347)
    at ClientPageRoot (http://localhost:3000/_next/static/chunks/node_modules__pnpm_1hx0o7t._.js:7249:46) @ http://localhost:3000/_next/static/chunks/0iv1_next_dist_07h4_bo._.js:1052
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) @ http://localhost:3000/favicon.ico:0
Error: Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
      <LoadingBoundary name="dashboard/" loading={null}>
        <HTTPAccessFallbackBoundary notFound={undefined} forbidden={undefined} unauthorized={undefined}>
          <RedirectBoundary>
            <RedirectErrorBoundary router={{...}}>
              <InnerLayoutRouter url="/dashboard" tree={[...]} params={{}} cacheNode={{rsc:{...}, ...}} ...>
                <SegmentViewNode type="page" pagePath="dashboard/...">
                  <SegmentTrieNode>
                  <ClientPageRoot Component={function DashboardHomePage} serverProvidedParams={{...}}>
                    <DashboardHomePage params={Promise} searchParams={Promise}>
                      <PageHeader eyebrow="Monday, Se..." title="Good eveni..." description="Start a ca...">
                        <div className="mb-6 flex ...">
                          <div className="min-w-0">
                            <div
                              className="text-muted-foreground mb-1.5 font-mono text-[11px] tracking-[0.14em] uppercase"
                            >
+                             Monday, September 14
-                             Monday, 14 September
                            ...
                      ...
                ...
              ...
    ...

    at throwOnHydrationMismatch (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:3120:56)
    at prepareToHydrateHostInstance (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:3174:23)
    at completeWork (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:6749:60)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:761:74)
    at completeUnitOfWork (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:9452:23)
    at performUnitOfWork (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:9387:28)
    at workLoopConcurrentByScheduler (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:9381:58)
    at renderRootConcurrent (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:9364:71)
    at performWorkOnRoot (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:8891:150)
    at performWorkOnRootViaSchedulerTask (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:10085:9)
    at MessagePort.performWorkUntilDeadline (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_0dh1vk6._.js:2647:64)
Error: Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
      <LoadingBoundary name="dashboard/" loading={null}>
        <HTTPAccessFallbackBoundary notFound={undefined} forbidden={undefined} unauthorized={undefined}>
          <RedirectBoundary>
            <RedirectErrorBoundary router={{...}}>
              <InnerLayoutRouter url="/dashboard" tree={[...]} params={{}} cacheNode={{rsc:{...}, ...}} ...>
                <SegmentViewNode type="page" pagePath="dashboard/...">
                  <SegmentTrieNode>
                  <ClientPageRoot Component={function DashboardHomePage} serverProvidedParams={{...}}>
                    <DashboardHomePage params={Promise} searchParams={Promise}>
                      <PageHeader eyebrow="Monday, Se..." title="Good eveni..." description="Start a ca...">
                        <div className="mb-6 flex ...">
                          <div className="min-w-0">
                            <div
                              className="text-muted-foreground mb-1.5 font-mono text-[11px] tracking-[0.14em] uppercase"
                            >
+                             Monday, September 14
-                             Monday, 14 September
                            ...
                      ...
                ...
              ...
    ...

    at throwOnHydrationMismatch (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:3120:56)
    at prepareToHydrateHostInstance (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:3174:23)
    at completeWork (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:6749:60)
    at runWithFiberInDEV (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:761:74)
    at completeUnitOfWork (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:9452:23)
    at performUnitOfWork (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:9387:28)
    at workLoopConcurrentByScheduler (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:9381:58)
    at renderRootConcurrent (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:9364:71)
    at performWorkOnRoot (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:8891:150)
    at performWorkOnRootViaSchedulerTask (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_react-dom_12pm6zj._.js:10085:9)
    at MessagePort.performWorkUntilDeadline (http://localhost:3000/_next/static/chunks/0iv1_next_dist_compiled_0dh1vk6._.js:2647:64)