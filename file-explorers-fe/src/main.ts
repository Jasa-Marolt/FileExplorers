import { createApp } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";

import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";

const app = createApp(App).use(store).use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
    },
});
app.mount("#app");
