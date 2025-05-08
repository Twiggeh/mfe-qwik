import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  const count = useSignal(0);
  return (
    <>
      <h1>Hi 👋</h1>
      count: {count}
      <button
        onClick$={() => {
          count.value += 1;
        }}
      >
        Increment
      </button>
      <div>
        Can't wait to see what you build with qwik!
        <br />
        Happy coding.
      </div>
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
