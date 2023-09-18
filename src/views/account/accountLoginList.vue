<template>
	<div class="app-container" v-loading="loading">
		<h2>登入歷程</h2>
		<div class="filter-container">
			<span class="filter-item" >
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>帳號</span>
					</div>
					<el-input type="text" v-model="listQuery.username"></el-input>
				</div>
			</span>
			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>
		</div>
		
		<el-table
      :data="list"
      empty-text="目前沒有資料"
      style="width: 100%"
      border
      fit
      :header-cell-style="{ 'background-color': '#F2F6FC' }"
    >
      <el-table-column
        v-for="(value, key) in headers"
        :key="key"
        :prop="key"
        :label="value.name"
        :sortable="value.sortable"
        :width="value.width"
        align="center"
      >
      
      </el-table-column>
    </el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />
  </div>
</template>

<script>
import Pagination from "@/components/Pagination";
import { getLoginData } from "@/api/auth";
import moment from "moment";

export default {
  name: "loginData",
	components: { Pagination },
	data() {
		return {
			loading: false,
			showAddDialog:false,
			showUpdateDialog:false,
			total: 0,
			list: [],
			listQuery:{
				username:'',
				pageCurrent: 1,
				pageSize: 50,
			},
			rowActive:{},
			headers:{
        id: {
          name: 'ID',
          sortable: false,
          width:200
        },
				UserId: {
					name: "User ID",
					sortable: false,
					width:200
				},
        UserName: {
          name: "使用者名稱",
          sortable: false,
          width:200
        },
        Ip: {
          name: "IP",
          sortable: false,
          width:200
        },
        LoginTime: {
          name: '登入時間',
          sortable: false
        },
      },
    };
	},
	computed: {
	},
	watch: {},
	created() {
    this.getList();
	},
  mounted() {
    this.getLoginData();
  },
  methods: {
    getList() {
      const query = {
        username: this.listQuery.username,
        pageCurrent: this.listQuery.pageCurrent,
        pageSize: this.listQuery.pageSize,
      };

      getLoginData(query)
        .then((response) => {
          this.list = response.data.loginData;
          this.total = response.data.total || 0;
        })
        .catch((error) => {
          console.log('Error fetching login data: ', error);
        });
    },
    formatTime(time) {
      return moment(time).add(8, 'hour').format("YYYY-MM-DD") + "\n" + moment(time).add(8, 'hours').format("HH:mm:ss");
    },
    getLoginData() {
      const query = {
        id: this.rowActive.id,
        UserId: this.rowActive.UserId,
        UserName: this.rowActive.UserName,
        Ip: this.rowActive.Ip,
        LoginTime: this.rowActive.LoginTime
      };
      getLoginData()
        .then((response) => {
          this.list = response.data.printUserName;
          this.list.forEach(l => {
            l.LoginTime = this.formatTime(l.LoginTime);
          })
        })
        .catch((error) => console.log(error));
    },
  },

};

</script>
