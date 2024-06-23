<template>
	<div class="app-container" v-loading="loading">
		<h2>登入歷程</h2>
		<div class="filter-container">
			<span class="filter-item" >
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>帳號</span>
					</div>
					<el-input type="text" v-model="listQuery.userName"></el-input>
				</div>
			</span>

      <span class="filter-item">
				<div style="font-size: 12px; color: #909399">登入日期</div>
				<time-picker class="filter-item" shortcutType="day" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/>
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
import TimePicker from '@/components/TimePicker';

export default {
  name: "loginData",
	components: { Pagination, TimePicker },
	data() {
		return {
			loading: false,
			showAddDialog:false,
			showUpdateDialog:false,
			total: 0,
      timeTabId: 4,
			dateRange: [ moment().startOf("month").toDate(), moment().endOf("month").toDate() ],
			list: [],
			listQuery:{
				userName:'',
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
				// UserId: {
				// 	name: "User ID",
				// 	sortable: false,
				// 	width:200
				// },
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

	},
  mounted() {
    this.getList();
  },
  methods: {
    
    formatTime(time) {
      return moment(time).format("YYYY-MM-DD") + "\n" + moment(time).format("HH:mm:ss");
    },
    getList() {
      this.loading = true;
      this.list = [];

      let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;

      // 傳入參數
      let query = {
        pageCurrent: this.listQuery.pageCurrent,
        pageSize: this.listQuery.pageSize,
        userName: this.listQuery.userName,
        timeStart: startDate,
        timeEnd: moment(endDate).add(1, 'd').format("YYYY-MM-DD"),
      };
      
      
      // 輸出參數
      getLoginData(query)
        .then((response) => {
          this.total = response.data.total;
          this.list = response.data.loginData;
          this.list.forEach(l => {
            l.LoginTime = this.formatTime(l.LoginTime);
          });
          this.loading = false;
        }).catch((error) => this.loading = false);
    },
  },
};

</script>


