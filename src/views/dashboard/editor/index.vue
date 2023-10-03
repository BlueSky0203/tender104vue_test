<template>
  <div class="dashboard-editor-container">
    <!-- <el-row :gutter="screenWidth<992 ? 15 : 30">
      <github-corner style="position: absolute; top: 0px; border: 0; right: 0;" />
      <el-col
        :span="12"
        :md="8"
        class="clearfix"
        style="float: left; display: flex; justify-content: flex-end"
      >
        <pan-thumb :image="avatar">
          Your roles:
          <span v-for="item in roles" :key="item" class="pan-info-roles">{{ item }}</span>
        </pan-thumb>
      </el-col>
      <el-col :span="12" :md="16" class="info-container">
        <span class="display_name">{{ name }}</span>
        <span>管理系統</span>
      </el-col>
    </el-row> -->
    <el-row style="margin: 0 20px">
      <el-col :span="24">
        <h2>歡迎</h2>
        <el-divider />
        <h3>登入紀錄</h3>
        <el-table
          empty-text="目前沒有資料"
          :data="loginList"
          :header-cell-style="{'background-color': '#F2F6FC'}"
          fit
          highlight-current-row
          style="width: 100%"
        >
          <el-table-column
            v-for="header in Object.keys(headers)"
            :key="header"
            :prop="header"
            :label="headers[header]"
            align="center"
          />
        </el-table>
      </el-col>
    </el-row>
		<br>
    <el-row>
      <el-col :span="24" :md="{ span: 14, offset: 10 }">
        <img :src="emptyGif" class="emptyGif" />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import PanThumb from "@/components/PanThumb";
// import { getLoginLog } from "@/api/cms"
import moment from "moment";
import { getLoginLog } from "@/api/auth";

export default {
  name: "DashboardEditor",
  components: { PanThumb },
  data() {
    return {
      name: localStorage.userName,
      // emptyGif: 'https://wpimg.wallstcn.com/0e03b7da-db9e-4819-ba10-9016ddfdaed3',
      emptyGif: "/assets/gif/report.gif",
      headers: {
        LoginTime: "登入時間",
        Ip: "IP",
        // Location: "位置"
      },
      screenWidth: window.innerWidth,
      loginList: [],
    };
  },
  computed: {
    ...mapGetters([
      // 'name',
      "avatar",
      "roles",
    ]),
  },
  mounted() {
    this.getList();
  },
  methods: {
    formatTime(time) {
      return moment(time).add(8, 'hour').format("YYYY-MM-DD") + "\n" + moment(time).add(8, 'hour').format("HH:mm:ss");
    },
    getList() {
      getLoginLog()
        .then((response) => { 
          this.loginList = response.data.loginLogs; 
          this.loginList.forEach(l => {
            l.LoginTime = this.formatTime(l.LoginTime);
          })
        }).catch((error) => console.log(error));
    }
  }
};
</script>

<style lang="scss" scoped>
// * {
//   border: 1px solid #000;
// }

.emptyGif {
	display: block;
  width: 100%;
  max-width: 670px;
  margin: 0 auto;
  filter: drop-shadow(5px 5px 1px rgba(200, 200, 200, 0.5))
}

.dashboard-editor-container {
	position: relative;
  background-color: #e3e3e3;
  min-height: 100vh;
  padding: 40px 10px;
  .pan-info-roles {
    font-size: 12px;
    font-weight: 700;
    color: #333;
    display: block;
  }
  .info-container {
    position: relative;
    // margin-left: 190px;
    height: 150px;
    line-height: 200px;
    .display_name {
      font-size: 40px;
      line-height: 48px;
      color: #212121;
      position: absolute;
      top: 25px;
    }
  }
  .el-divider {
    background-color: #ccc;
  }
}

@media screen and (max-width: 991px) {
  .emptyGif {
    width: 100%;
    // margin: 0;
  }

  .dashboard-editor-container .info-container .display_name {
    font-size: 32px;
  }

  .el-table >>> .cell {
    white-space: pre-wrap;
  }
}
</style>
