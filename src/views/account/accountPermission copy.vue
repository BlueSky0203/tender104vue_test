<template>
	<div class="app-container" v-loading="loading">
		<h2>權限管理</h2>
		
		<div class="filter-container">
			<div class="filter-item">
				帳號: {{ accountData.userName }}
			</div>
		</div>
		<el-row>
			<el-col :span="12">
				<el-tree
					ref="tree1"
					:data="firstHalfTreeData"
					node-key="id"
					show-checkbox
					@check="handleCheck1"
				>
					<span slot-scope="{ node, data }" :style="node.level === 1 ? { fontSize: '18px', lineHeight: 2 } : {}">
						{{ data.label }}
					</span>
				</el-tree>
			</el-col>
			<el-col :span="12">
				<el-tree
					ref="tree2"
					:data="secondHalfTreeData"
					node-key="id"
					show-checkbox
					@check="handleCheck2"
				>
					<span slot-scope="{ node, data }" :style="node.level === 1 ? { fontSize: '18px', lineHeight: 2 } : {}">
						{{ data.label }}
					</span>
				</el-tree>
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

/* Router Modules */
import { asyncRoutes } from '@/router/index.js';


export default {
	name: "accountPermission",
	data() {
		return {
			loading: false,
			// treeData: [],
			roles1:[],
			roles2:[],
			firstHalfTreeData: [],
			secondHalfTreeData: [],
			nodeIdCounter: 0, // 用於生成唯一節點ID,
			listQuery: {
				userId: 0
			},
			accountData:{},
			checkedKeys1: [],
			checkedKeys2: [],
			sumCheckedKeys:[]
		};
	},
	created() {
		if (this.$route.query.userId) {
			this.listQuery.userId = this.$route.query.userId;
			this.getList();
		} else this.$router.push({ path: "/account/accountList" });
	},
	mounted() {},
	methods: {
		//自動生成ID
		generateNodeId() {
			const nodeId = this.nodeIdCounter.toString();
			this.nodeIdCounter++;
			return nodeId;
		},
		getList() {
			this.loading = true;
			this.roles1 = [];
			this.roles2 = [];
			this.checkedKeys1 = [];
			this.checkedKeys2 = [];
			this.sumCheckedKeys = [];

			getPermit({
				userId: Number(this.listQuery.userId)
			}).then(response => {
				this.accountData = response.data;
				this.permissionTree();

				this.accountData.roles.forEach(role => {
					// console.log(role);
					// this.checkRole(this.treeData, role);
					this.checkRole(this.firstHalfTreeData, role); 
					this.checkRole(this.secondHalfTreeData, role); 

				});
				

				this.loading = false;
			}).catch(err => this.loading = false);
		},
		checkRole(nodes, role) {
			// console.log(nodes);
			nodes.forEach(node => {
				if (node.roles.includes(role)) {
					if(this.roles1.includes(role)) this.checkedKeys1.push(role);
					if(this.roles2.includes(role)) this.checkedKeys2.push(role);
					this.$nextTick(() => {
						// this.$refs.tree.setChecked(node, true);
						this.$refs.tree1.setChecked(node, true);
						this.$refs.tree2.setChecked(node, true);
					});
				}
				if (node.children && node.children.length > 0) {
					this.checkRole(node.children, role);
				}
			});
		},
		handleCheck1(data, checked) {
			const selectedPermissions = [];
			checked.checkedNodes.forEach(node => {
				const { roles } = node;
				if (roles && roles.length > 0) {
					selectedPermissions.push(...roles);
				}
			});
			//去重
			this.checkedKeys1 = Array.from(new Set(selectedPermissions));
		},
		handleCheck2(data, checked) {
			const selectedPermissions = [];
			checked.checkedNodes.forEach(node => {
				const { roles } = node;
				if (roles && roles.length > 0) {
					selectedPermissions.push(...roles);
				}
			});
			//去重
			this.checkedKeys2 = Array.from(new Set(selectedPermissions));
		},
		//路由規則轉樹型控件格式
		permissionTree() {
			const formatRoutes = (routes, id) => {
				// console.log(routes);
				const permissionTree = routes.map(route => {
					let node = null; 
					if (route.meta.roles.some(role => this.accountData.rolesPermit.includes(role))) {
						node = {
							id: this.generateNodeId(),
							label: route.meta.title + (route.hidden ? " (隱藏)" : ""),
							roles: route.meta.roles,
						};
						if (route.children && route.children.length > 0) {
							node.children = formatRoutes(route.children, id);
						}
						this[id].push(...route.meta.roles);
					}
					return node;
				}).filter(route => route);
				return permissionTree;
			};

			// this.treeData = [];

			// asyncRoutes.forEach(route => {
			// 	if(route.path != '*') this.treeData.push(...formatRoutes([route]));
			// })

			const halfIndex = Math.ceil(asyncRoutes.length / 2);
			const firstHalfRoutes = asyncRoutes.slice(0, halfIndex);
			const secondHalfRoutes = asyncRoutes.slice(halfIndex);
		
			this.firstHalfTreeData = [];
			this.secondHalfTreeData = [];
		
			firstHalfRoutes.forEach(route => {
				if(route.path != '*')this.firstHalfTreeData.push(...formatRoutes([route], 'roles1'));
			});
			secondHalfRoutes.forEach(route => {
				if(route.path != '*')this.secondHalfTreeData.push(...formatRoutes([route], 'roles2'));
			});

			

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
				this.sumCheckedKeys.push(...this.checkedKeys1)
				this.sumCheckedKeys.push(...this.checkedKeys2)
				this.sumCheckedKeys = Array.from(new Set(this.sumCheckedKeys));
				
				// 將選中的權限訊息傳給API
				setPermit({
					userId: this.listQuery.userId,
					roles: this.sumCheckedKeys
				}).then(response=>{
					this.$message({
						type: 'success',
						message: `提交成功!`
					})
					this.getList();
				}).catch(err => {this.loading = false});
			})
		}
	},
	
};
</script>

<style lang="sass">
	.filter-container
		.filter-item
			margin-right: 5px
	.button-container
		display: flex
		justify-content: center
		margin-top: 20px
	.el-tree-node 
		border: 1px black
		.el-tree-node__content
			background-color:#EBEEF5
			height: 30px
			margin-bottom: 5px
			margin-right: 2px
		.el-tree-node__children
			.el-tree-node 
				.el-tree-node__content
					background-color: white
</style>