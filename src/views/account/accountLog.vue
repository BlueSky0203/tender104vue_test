<template>
	<div class="app-container" v-loading="loading">
		<h2>帳號歷程</h2>
		<div class="filter-container">
			<span class="filter-item" >
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>帳號</span>
					</div>
					<el-input type="text" v-model="listQuery.userName"></el-input>
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
				userName:'',
				pageCurrent: 1,
				pageSize: 50,
			},
      statusTextMap: {
        1: '修改密碼',
        2: '備註',
        30: '停用',
        31: '啟用'
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

	},
	watch: {},
	created() {
	},
  mounted() {
    this.getList()
  },
  methods: {
    formatTime(time) {
      return moment(time).add(8, 'hour').format("YYYY-MM-DD") + "\n" + moment(time).add(8, 'hours').format("HH:mm:ss");
    },
    getList() {
      let query = {
        pageCurrent: this.listQuery.pageCurrent,
        pageSize: this.listQuery.pageSize,
      };
      getUsersData(query)
        .then((response) => {
          this.total = response.data.total;
          this.list = response.data.usersData;
          this.list.forEach(l => {
            l.Create_At = this.formatTime(l.Create_At);
          })
        })
        .catch((error) => console.log(error));
    },
  },

};

</script>
