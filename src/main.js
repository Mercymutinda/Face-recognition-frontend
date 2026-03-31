import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import BaseCard from "@/components/BaseCard.vue"; // Ensure you created this file
// Template components
import BaseBlock       from "@/components/BaseBlock.vue";
import BaseBackground  from "@/components/BaseBackground.vue";
import BasePageHeading from "@/components/BasePageHeading.vue";
import BaseModal       from "@/components/BaseModal.vue";

// Template directives
import clickRipple from "@/directives/clickRipple";

// Bootstrap
import * as bootstrap from "bootstrap";
window.bootstrap = bootstrap;

const app = createApp(App);

app.component("BaseBlock",       BaseBlock);
app.component("BaseBackground",  BaseBackground);
app.component("BasePageHeading", BasePageHeading);
app.component("BaseModal",       BaseModal);
app.component("BaseCard",        BaseCard); // <--- ADD THIS
app.directive("click-ripple", clickRipple);

app.use(createPinia());
app.use(router);
app.mount("#app");