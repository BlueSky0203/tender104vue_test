<template>
	<div class="app-container" v-loading="loading">
		<h2>帳號歷程</h2>
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
        
        <template slot-scope="{ row, column }">
          <span v-if="key === 'ActionType'">{{ statusTextMap[row.ActionType] }}</span>
          <span v-else>{{ row[column.property] }}</span>
        </template>

      </el-table-column>
    </el-table>


		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />
  </div>
</template>

<script>
import Pagination from "@/components/Pagination";
import { getUsersData } from "@/api/auth";
import moment from "moment";

export default {
  name: "usersData",
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
          width:100
        },
				UserId: {
					name: "User ID",
					sortable: false,
					width:100
				},
        UserName: {
          name: "使用者名稱",
          sortable: false,
          width:150
        },
        ActionType: {
          name: "狀態操作",
          sortable: false,
          width: 150
        },
				FromUid: {
					name: "FromUid",
					sortable: false,
					width:150
				},
				Create_At: {
					name: "創建日期",
					sortable: false,
					width:200
				},
        FromUsername: {
          name: '操作者',
          sortable: false,
          width:150
        },
        Notes: {
					name: "備註",
					sortable: false
				},
			},
		};
	},
	computed: {
		statusTextMap() {
      return {
        30: '停用',
        31: '啟用',
      };
    },
	},
	watch: {},
	created() {
	},
  mounted() {
    this.getUsersData()
  },
  methods: {
    formatTime(time) {
      return moment(time).add(8, 'hour').format("YYYY-MM-DD") + "\n" + moment(time).add(8, 'hours').format("HH:mm:ss");
    },
    getUsersData() {
      const query = {
        id: this.rowActive.id,
        UserId: this.rowActive.UserId,
        UserName: this.rowActive.UserName,
        FromUsername: this.rowActive.FromUsername,
        ActionType: this.rowActive.ActionType,
        FromUid: this.rowActive.FromUid,
        Create_At: this.rowActive.Create_At,
        Notes: this.rowActive.Notes
      };
      getUsersData()
        .then((response) => {
          this.list = response.data.printUid;
          this.list.forEach(l => {
            l.Create_At = this.formatTime(l.Create_At);
          })
        })
        .catch((error) => console.log(error));
    },
  },

};

</script>
