<template>
  <div class="dashboard-container" v-loading="loading">
    <component :is="currentRole" @isLoading="isLoading" />
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import adminDashboard from "./admin";
import editorDashboard from "./editor";

export default {
  name: "Dashboard",
  components: { adminDashboard, editorDashboard },
  data() {
    return {
      loading: false,
      // currentRole: "adminDashboard",
      currentRole: "editorDashboard",
    };
  },
  computed: {
    ...mapGetters(["roles"]),
  },
  created() {
    // if (!this.roles.includes("admin")) {
    //   this.currentRole = "editorDashboard";
    // }
  },
  methods: {
    isLoading(boolean) {
      this.loading = boolean;
    },
  },
};
</script>
<style lang="sass">
.dashboard-container
	height: calc(100vh - 50px)
</style>