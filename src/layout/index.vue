<template>
  <div :class="classObj" class="app-wrapper">
    <div v-if="device==='mobile'&&sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <sidebar class="sidebar-container" />
    <div :class="{hasTagsView:needTagsView}" class="main-container">
      <div :class="{'fixed-header':fixedHeader}">
        <navbar @showChangePassword="showChangePassword"/>
        <!-- <tags-view v-if="needTagsView" /> -->
      </div>
      <app-main />
      <!-- <right-panel v-if="showSettings">
        <settings />
      </right-panel> -->
    </div>

    <el-dialog
      title="修改密碼"
      width="300px"
      :visible.sync="isShowChangePassword"
      :show-close="false"
      :before-close="() => {}"
      center
    >
      <div class="filter-container">
        <el-form :model="list" :rules="listRules">
          <el-form-item prop="username">
            <el-input
              class="filter-item"
              v-model="list.originPassword"
              placeholder="舊密碼"
              type="password"
              show-password
              auto-complete="new-password"
            />
          </el-form-item>
          <el-form-item prop="changePassword">
            <el-input
              class="filter-item"
              v-model="list.changePassword"
              placeholder="新密碼"
              type="password"
              show-password
              auto-complete="new-password"
            />
          </el-form-item>
          <el-form-item prop="confirmedPassword">
            <el-input
              class="filter-item"
              v-model="list.confirmedPassword"
              placeholder="確認新密碼"
              type="password"
              show-password
              auto-complete="new-password"
            />
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isShowChangePassword = false">取消</el-button>
        <el-button type="primary" @click="changePassword()">確定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import RightPanel from "@/components/RightPanel";
import { AppMain, Navbar, Settings, Sidebar, TagsView } from "./components";
import ResizeMixin from "./mixin/ResizeHandler";
import { mapState } from "vuex";
import { changePassword } from "@/api/auth";

export default {
  name: "Layout",
  components: {
    AppMain,
    Navbar,
    RightPanel,
    Settings,
    Sidebar,
    TagsView,
  },
  mixins: [ResizeMixin],
  data() {
    const validateChangePassword = (rule, value, callback) => {
      if (value.length < 6) {
        callback(new Error("密碼不能少於6位數字"));
      } else {
        callback();
      }
    };
    const validateconfirmedPassword = (rule, value, callback) => {
      if (value != this.list.changePassword) {
        callback(new Error("兩次輸入的密碼不同"));
      } else {
        callback();
      }
    };

    return {
      isShowChangePassword: false,
      isShowSwitchGuild: false,
      joinedGuildList: [],
      guildId: localStorage.guildId,
      guildName: localStorage.guildName,
      list: {
        originPassword: "",
        changePassword: "",
        confirmedPassword: "",
        guildId: "",
      },
      listRules: {
        changePassword: [
          {
            required: true,
            trigger: "blur",
            validator: validateChangePassword,
          },
        ],
        confirmedPassword: [
          {
            required: true,
            trigger: "blur",
            validator: validateconfirmedPassword,
          },
        ],
      },
    };
  },
  computed: {
    ...mapState({
      sidebar: (state) => state.app.sidebar,
      device: (state) => state.app.device,
      showSettings: (state) => state.settings.showSettings,
      needTagsView: (state) => state.settings.tagsView,
      fixedHeader: (state) => state.settings.fixedHeader,
    }),
    classObj() {
      return {
        hideSidebar: !this.sidebar.opened,
        openSidebar: this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === "mobile",
      };
    },
  },
  methods: {
    handleClickOutside() {
      this.$store.dispatch("app/closeSideBar", { withoutAnimation: false });
    },
    showChangePassword() {
      this.isShowChangePassword = true;
    },
    changePassword() {
      if (this.list.changePassword.length < 6) {
        this.$message({
          message: "密碼不能少於6位數字",
          type: "error",
        });
      } else if (this.list.changePassword != this.list.confirmedPassword) {
        this.$message({
          message: "兩次輸入的密碼不同",
          type: "error",
        });
      } else {
        this.isShowChangePassword = false;
        changePassword({
          oldPwd: this.list.originPassword,
          newPwd: this.list.changePassword,
        }).then((response) => {
          if (response.statusCode == 20000) {
            this.list = {
              originPassword: "",
              changePassword: "",
              confirmedPassword: "",
            };
            this.$message({
              message: "修改成功",
              type: "success",
            });
          } else {
            this.$message({
              message: "修改失敗",
              type: "error",
            });
          }
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import "~@/styles/mixin.scss";
@import "~@/styles/variables.scss";

.app-wrapper {
  @include clearfix;
  position: relative;
  height: 100%;
  width: 100%;

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - #{$sideBarWidth});
  transition: width 0.28s;
}

.hideSidebar .fixed-header {
  width: calc(100% - 54px);
}

.mobile .fixed-header {
  width: 100%;
}
</style>
