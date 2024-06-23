<template>
	<div class="app-container account-permission" v-loading="loading">
		<h2>權限管理</h2>
		
		<div class="filter-container">
			<div class="filter-item">帳號: {{ accountData.userName }}</div>
		</div>
		<el-row>
			<el-col
				v-for="(route, index) in routeArr"
				:key="route.name"
				:span="8"
				:class="{ 'check-all-col': route.checkAll }"
			>
				<el-checkbox
					v-model="route.checkAll"
					class="check-all-btn"
					border
					:indeterminate="route.isIndeterminate"
					@change="handleCheckAllChange(route, index)"
					>{{ route.title }}</el-checkbox>
				<el-checkbox-group v-model="checked" style="display: flex; flex-wrap: wrap;" @change="handleCheckedChange(route, index)">
					<span v-for="(val, key) in route.roleMap" :key="key" style="display: flex; align-items: center; padding: 0 14px 0 0">
						<el-checkbox :label="key">
							<span style="white-space: pre-wrap;">{{ key }} - {{ val.titles.join("、") }}</span>
						</el-checkbox>
					</span>
				</el-checkbox-group>
			</el-col>
		</el-row>
		<div class="button-container">
			<el-button type="info" @click="undo()">取消返回</el-button>
			<el-button type="success" @click="confirmPermission()">確認送出</el-button>
		</div>
		
	</div>
</template>

<script>
import { getPermit, setPermit } from '@/api/auth';
import { asyncRoutes } from '@/router/index.js';


export default {
	name: "accountPermission",
	data() {
		return {
			loading: false,
			listQuery: {
				userId: 0
			},
			routeArr: [],
			accountData: {}
		};
	},
	created() {
		if (this.$route.query.userId) {
			this.listQuery.userId = this.$route.query.userId;
			this.getList();
		} else this.$router.push({ path: "/account/accountList" });
	},
	mounted() {},
	computed: {
		checked: {
			get() {
				let checked = []; 
				const roleMap = this.routeArr.map(route => route.roleMap);
				roleMap.forEach(roles => {
					Object.keys(roles).forEach(key => {
						if(roles[key].checked) checked.push(key);
					})
				})

				checked = [...new Set(checked)];

				return checked
			},
			set(val) {
				// console.log(val);
				this.routeArr.forEach((route, index) => {
					Object.keys(route.roleMap).forEach(key => {
						if(val.includes(key)) route.roleMap[key].checked = true;
						else route.roleMap[key].checked = false;
					})

					this.$set(this.routeArr, index, route);
				})
			}
		}
	},
	methods: {
		getList() {
			this.loading = true;
			this.routeArr = [];

			getPermit({
				userId: Number(this.listQuery.userId)
			}).then(response => {
				this.accountData = response.data;
				this.accountData.rolesPermit = this.accountData.rolesPermit.filter(role => role != 'beta');

				const formatRoutes = (routes) => {
					// console.log(routes);
					const permissionArr = routes.map(route => {
						let node = null; 
						if (route.meta.roles.some(role => this.accountData.rolesPermit.includes(role)) && !route.hidden) {
							node = {
								title: route.meta.title,
								name: route.name,
								roles: route.meta.roles
							};
							if (route.children && route.children.length > 0) node.children = formatRoutes(route.children);
						}
						return node;
					}).filter(route => route);
					return permissionArr;
				};

				this.routeArr = formatRoutes(asyncRoutes.filter(route => route.path != '*'));
				this.routeArr.forEach(route => {
					route.checkAll = false;
					route.isIndeterminate = false;

					route.roleMap = route.children.reduce((acc, cur) => {
						if(cur.children && cur.children.length > 0) {
							for(const routeChildren of cur.children) {
								for(const role of routeChildren.roles) {
									if(acc[role] == undefined) {
										acc[role] = {
											titles: [ routeChildren.title ],
											checked: this.accountData.roles.includes(role)
										};
									} else acc[role].titles.push(routeChildren.title);
								}
							}
						} else {
							for(const role of cur.roles) {
								if(acc[role] == undefined) {
									acc[role] = {
										titles: [ cur.title ],
										checked: this.accountData.roles.includes(role)
									};
								} else acc[role].titles.push(cur.title);
							}
						}
						return acc;
					}, {})

					const temp = Object.keys(route.roleMap).filter(key => route.roleMap[key].checked);
					if (temp.length == 0) route.checkAll = false;
					else if (temp.length == Object.keys(route.roleMap).length) route.checkAll = true;
					else route.isIndeterminate = true;
				});

				this.loading = false;
			}).catch(err => this.loading = false);
		},
		undo(){
			this.$router.push({ path: "/account/accountList" });
		},
		confirmPermission(){
			this.$confirm(`是否確定更改帳號${this.accountData.userName}的權限?`, '提示', {
				confirmButtonText: '確定',
				cancelButtonText: '取消',
			}).then(() => {
				this.loading = true;
				//去重
				const roles = [...new Set(this.checked)];
				
				setPermit({
					userId: this.listQuery.userId,
					roles
				}).then(response => {
					this.$message({
						type: 'success',
						message: `提交成功!`
					})
					this.getList();
				}).catch(err => {this.loading = false});
			})
		},
		handleCheckAllChange(route, index) {
			if (route.checkAll) this.checked.push(...Object.keys(route.roleMap));
			else this.checked = this.checked.filter(el => Object.keys(route.roleMap).indexOf(el) == -1);
			this.checked = [...new Set(this.checked)];
			route.isIndeterminate = false;

			this.$set(this.routeArr, index, route);
		},
		handleCheckedChange(route, index) {
			const temp = Object.keys(route.roleMap).filter(key => this.checked.indexOf(key) != -1);

			route.isIndeterminate = false;
			route.checkAll = false;
			if (temp.length == 0) route.checkAll = false;
			else if (temp.length == Object.keys(route.roleMap).length) route.checkAll = true;
			else route.isIndeterminate = true;

			this.$set(this.routeArr, index, route);
		},
	},
	
};
</script>

<style lang="sass">
.account-permission
	.filter-container
		.filter-item
			margin-right: 5px
	.button-container
		display: flex
		justify-content: center
		margin-top: 20px
	.el-row
		display: flex
		flex-wrap: wrap
		.el-col
			padding: 10px 0px
			position: relative
			&::before
				display: block
				content: ''
				position: absolute
				border: 1px solid #eee
				height: 100%
				width: 100%
			&.check-all-col::before
				box-shadow: 0px 0px 2px #409EFF
			.el-checkbox
				width: 100%
				padding-left: 20px
			.check-all-btn
				padding-left: 10px
				margin-bottom: 5px
				background-color: #F2F6FC
				border: none
				border-radius: 0px
				box-shadow: inset 0px 0px 1px #C0C4CC
				&.is-checked
					background-color: #409EFF
					span
						color: white
			.el-checkbox__input.is-indeterminate .el-checkbox__inner
				background-color: lighten(#409EFF, 15)
			.el-checkbox-group 
				.el-checkbox, .el-checkbox__input
					height: 100%
</style>