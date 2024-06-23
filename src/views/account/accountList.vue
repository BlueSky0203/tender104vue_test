<template>
	<div class="app-container" v-loading="loading">
		<h2>帳號列表</h2>
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
			<el-button style="float:right;" @click="showAddDialog=true" type="success">新增帳號</el-button>
		</div>
		
		<el-table
			:data="list"
			empty-text="目前沒有資料"
			style="width: 100%"
			border
			fit
			:header-cell-style="{ 'background-color': '#F2F6FC' }">
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
					<span v-if="['Active'].includes(column.property)">
						<span :style="{ color: row.Active ? '#000000' : '#ff4949' }">
							停用
						</span>
						<el-switch
							:value="String(row.Active)" 
							@change="updateActive(row, $event)"
							active-color="#13ce66"
							inactive-color="#ff4949"
							active-value="1"
							inactive-value="0">
						</el-switch>
						<span :style="{ color: row.Active ? '#13ce66' : '#000000' }">
							啟用
						</span>
					</span>
					<span v-else-if="['Create_At','Update_At'].includes(column.property)">
						<span>{{ formatTime(row[column.property]) }}</span>
					</span>
					<span v-else-if="['changePassword'].includes(column.property)">
						<el-button @click="showUpdate(row)" size="small" type="danger" plain>修改密碼</el-button>
					</span>
					<span v-else-if="['Notes'].includes(column.property)">
						<el-input v-if="row.edit" v-model="row.Notes" style="width: 80%" />
						<span v-else>{{ row.Notes || "-" }}</span>
						<el-button v-if="!row.edit" type="text" style="margin-left: 10px" size="mini" @click="row.edit = true"><i class="el-icon-edit" /></el-button>
						<span v-if="row.edit">
							<el-button type="text" @click="editNotes(row)"><i class="el-icon-check" style="color: #67C23A"/></el-button>
							<el-button type="text" style="margin-left: 5px" @click="row.edit=false"><i class="el-icon-close" style="color: #F56C6C" /></el-button> 
						</span>
					</span>
					<span v-else-if="['permissionManage'].includes(column.property)">
						<el-button size="mini" type="success" @click="permissionManage(row)">管理</el-button>
					</span>
					<span v-else>
						<span>{{ row[column.property] }}</span>
					</span>

					<span v-if="['CreateName'].includes(column.property)">
						{{ row.CreateName ? '' : '-' }}
					</span>

				</template>
			</el-table-column>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />

		<!-- 新增帳號對話框 -->
		<el-dialog
			title="新增帳號"
			:visible.sync="showAddDialog"
			width="30%">
			<el-form ref="form" :model="newAccountForm" label-width="50px">
				<el-form-item label="帳號">
					<el-input v-model="newAccountForm.account"></el-input>
				</el-form-item>
				<el-form-item label="密碼">
					<el-input v-model="newAccountForm.password"></el-input>
				</el-form-item>
				<el-form-item label="暱稱">
					<el-input v-model="newAccountForm.nickname"></el-input>
				</el-form-item>
			</el-form>
			<span slot="footer" class="dialog-footer">
				<el-button @click="showAddDialog = false">取消</el-button>
				<el-button type="primary" @click="addAccount()">確定</el-button>
			</span>
		</el-dialog>

		<!-- 修改密碼對話框 -->
		<el-dialog
			title="修改密碼"
			:visible.sync="showUpdateDialog"
			width="30%">
			<el-form ref="form" :model="updatePasswordForm" label-width="70px">
				<el-form-item label="新密碼">
					<el-tooltip class="item" effect="dark" content="請輸入至少6位數" placement="bottom-start">
						<el-input v-model="updatePasswordForm.newPassword"></el-input>
					</el-tooltip>
				</el-form-item>
			</el-form>
			<span slot="footer" class="dialog-footer">
				<el-button @click="showUpdateDialog = false">取消</el-button>
				<el-button type="primary" @click="updatePassword()">確定</el-button>
			</span>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import Pagination from "@/components/Pagination";
import { getAccountList,addAccount,changeActive,updatePassword,updateNotes,getLoginLog } from "@/api/auth";   

export default {
	name: "accountList",
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
			rowActive:{},
			headers:{
				UserId: {
					name: "UID",
					sortable: false,
					width:60
				},
				UserName: {
					name: "帳號",
					sortable: false,
					width:120
				},
				NickName: {
					name: "暱稱",
					sortable: false,
					width:120
				},
				Create_At: {
					name: "創建日期",
					sortable: false,
					width:100
				},
				Update_At: {
					name: "更新日期",
					sortable: false,
					width:100
				},
				Active: {
					name: "狀態",
					sortable: false,
					width:135
				},
				changePassword: {
					name: "動作",
					sortable: false,
					width:120
				},
				CreateName: {
					name: "創建人",
					sortable: false,
					width:120
				},
				Notes: {
					name: "備註",
					sortable: false
				},
				permissionManage: {
					name: "權限管理",
					sortable: false,
					width:80
				}
			},
			newAccountForm: {
				account:"",
				password:"",
				nickname:""
			},
			updatePasswordForm: {
				newPassword:"",
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
		getList(){
			this.loading = true;
			this.list = [];
			let query = {
				userName:this.listQuery.userName,
				pageCurrent: this.listQuery.pageCurrent,
				pageSize: this.listQuery.pageSize,
			};
			getAccountList(query).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.total = 0;
				} else {
					this.total = response.data.total;
					this.list = response.data.list;
					this.list.forEach(l => {
						this.$set(l, "edit", false);
					})
				}
				this.loading = false;
			}).catch(err => this.loading = false);
			
			this.loading = false;
			
		},
		//登入紀錄
		getLoginLog() {
			const query = {
				UserId: this.rowActive.UserId,
				Ip: this.rowActive.Ip,
				LoginTime: this.rowActive.LoginTime,
			};
			getLoginLog(query)
				.then((response) => {
					this.loginList = response.data.loginList;
				})
				.catch((error) => console.log(error));
		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD");
		},
		//新增帳號
		addAccount(){
			this.showAddDialog = false;
			addAccount({
				account: this.newAccountForm.account,
				password: this.newAccountForm.password,
				nickname: this.newAccountForm.nickname
			}).then(response => {
					this.getList();
					this.newAccountForm = {
						account: "",
						password: "",
						nickname: ""
					};
					this.loading = false;
					this.$message({
						type: 'success',
						message: `建立成功`
					})
			}).catch(err => {
				this.loading = false;
				this.$message({
					type: 'warning',
					message: '建立失敗'
				})
			});
		},
		//狀態切換
		updateActive(row,value){
			this.$confirm(`是否確定 ${row.Active==1?'停用':'啟用'} ${row.UserName}的權限?`, '提示', {
				confirmButtonText: '確定',
				cancelButtonText: '取消',
				type: 'info'
			}).then(() => {
				changeActive({
					"userId": row.UserId,
					"isActive": Number(value)
				}).then(response=>{
					this.getList()
				}).catch(err => {this.loading = false});
				this.$message({
					type: 'success',
					message: `成功 ${row.Active==1?'停用':'啟用'} ${row.UserName}的權限!`
				});
			}).catch(() => {
				this.$message({
					type: 'info',
					message: '已取消'
				});					
			});
		},
		showUpdate(row){
			this.showUpdateDialog=true;
			this.rowActive=row;
		},
		updatePassword(){
			this.$confirm(`是否確定更改帳號${this.rowActive.UserName}的密碼?`, '提示', {
				confirmButtonText: '確定',
				cancelButtonText: '取消',
				type: 'warning'
			}).then(() => {
				if(this.updatePasswordForm.newPassword.length>=6){			
					updatePassword({
						userId: this.rowActive.UserId,
						newPwd: this.updatePasswordForm.newPassword
					}).then(response=>{
						console.log(response);
						this.getList()
					}).catch(err => {this.loading = false});
					this.updatePasswordForm.newPassword="";
					this.updatePasswordForm.confirmPassword="";
					this.showUpdateDialog=false;
					this.$message({
						type: 'success',
						message: `成功更改密碼!`
					})
				}else{
					this.$message({
						type: 'warning',
						message: '密碼輸入有誤，請重新輸入'
					})
				}
			})
		},
		editNotes(row){
			updateNotes({
				userId:row.UserId,
				notes:row.Notes
			}).then(response => {
				this.$message({
					type: 'success',
					message: `修改成功!`
				})
				this.getList();
			}).catch(err => this.loading = false);
		},
		//權限管理
		permissionManage(row) {
			this.$router.push({
				path: "/account/accountPermission",
				query: { userId: row.UserId },
			});
		},
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
</style>