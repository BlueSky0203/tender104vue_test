<template>
	<div class="app-container PCI-Manager" v-loading="loading">
		<h2>PCI管理</h2>
		<div class="filter-container">
			<div class="filter-item">
				<div class="filter-item">
					<div class="select-contract el-input el-input--medium el-input-group el-input-group--prepend">
						<div class="el-input-group__prepend">
							<span>合約</span>
						</div>
						<el-select v-model.number="listQuery.tenderId" class="tender-select" placeholder="請選擇" popper-class="type-select tender" @change="listQuery.pageCurrent = 1; getList();">
							<el-option v-for="(obj, id) in options.tenderMap" :key="id" :value="Number(id)" :label="obj.tenderName" />
						</el-select>
					</div>
				</div>
			</div>
			<!-- <el-button class="filter-item" type="primary" icon="el-icon-search" style="margin-left: 20px" @click="listQuery.pageCurrent = 1; getList();">搜尋</el-button> -->
		</div>

		<el-table
			empty-text="目前沒有資料"
			:data="list"
			border
			fit
			highlight-current-row
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			stripe
			style="width: 100%"
		>
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:width="key == 'round' ? 60 : ['roundStart', 'roundEnd'].includes(key) ? 200 : null"
				:formatter="formatter"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="[ 'roundStart', 'roundEnd' ].includes(column.property) && row.edit">
						<el-date-picker v-model="row[column.property]" type="date" value-format="yyyy-MM-dd" placeholder="選擇日期" style="width: 80%" />
						<!-- <el-input v-model="row[column.property]" size="mini" style="width: 100px" /> -->
						<el-button type="text" @click="row.edit = false; setRoundTime(row);">
							<i class="el-icon-success" />
						</el-button>
						<el-button type="text" @click="row.edit = false; getList();">
							<i class="el-icon-error" />
						</el-button>
					</span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
			<el-table-column v-if="checkPermission(['rAdm'])" label="即時運算" align="center" width='120'>
				<template slot-scope="{ row }">
					<el-button class="btn-action" type="primary" plain @click="calPCI(row.roundStart, row.roundEnd)">重新計算</el-button>
				</template>
			</el-table-column>

			<el-table-column label="區塊" align="center">
				<template slot-scope="{ row }">
					<el-row :gutter="5" type="flex" justify="center" align="middle">
						<el-col :span="14">
							<el-input v-model="row.blockId" placeholder="區塊編碼" />
						</el-col>
						<el-col :span="10">
							<el-button-group>
								<el-button class="btn-action" type="primary" plain @click="calPCISpec(row.blockId, row.roundStart, row.roundEnd, 0)">重算</el-button>
								<el-button class="btn-action" type="info" plain @click="calPCISpec(row.blockId, row.roundStart, row.roundEnd, -1)">重置</el-button>
								<el-button class="btn-action" type="success" plain @click="calPCISpec(row.blockId, row.roundStart, row.roundEnd, 100)">滿值</el-button>
							</el-button-group>
						</el-col>
					</el-row>
				</template>
			</el-table-column>

			<el-table-column label="路段" align="center">
				<template slot-scope="{ row }">
					<el-row :gutter="5" type="flex" justify="center" align="middle">
						<el-col :span="14">
							<el-input v-model="row.roadName" placeholder="道路名稱" />
						</el-col>
						<el-col :span="10">
							<el-button-group>
								<el-button class="btn-action" type="primary" plain @click="calPCIRoad(row.roadName, row.roundStart, row.roundEnd, 0)">重算</el-button>
								<el-button class="btn-action" type="info" plain @click="calPCIRoad(row.roadName, row.roundStart, row.roundEnd, -1)">重置</el-button>
								<el-button class="btn-action" type="success" plain @click="calPCIRoad(row.roadName, row.roundStart, row.roundEnd, 100)">填滿</el-button>
							</el-button-group>
						</el-col>
					</el-row>
				</template>
			</el-table-column>

			<el-table-column label="操作" width="100" align="center">
				<template slot-scope="{ row }">
					<el-button v-if="!row.edit" class="btn-action" type="primary" plain @click="row.edit = true">編輯</el-button>
					<el-button v-else type="info" class="btn-action" @click="row.edit = false; getList();">取消</el-button>
					<!-- <el-button type="danger" class="btn-action" @click=" rowActive = row; showConfirm = true;">刪除</el-button> -->
				</template>
			</el-table-column>
		</el-table>
	</div>
</template>

<script>
import moment from "moment";
import { getTenderMap, getTenderRound, setTenderRound } from "@/api/type";
import { resetPCI, updatePCI, updatePCIByName } from "@/api/toolV1";
import checkPermission from '@/utils/permission';

export default {
	name: "PCIManager",
	data() {
		return {
			loading: false,
			dialogMapVisible: true,
			timeTabId: 1,
			dateTimePickerVisible: false,
			screenWidth: window.innerWidth,
			listQuery: {
				tenderId: 100,
				blockId: null
			},
			headers: {
				round: {
					name: "回合",
					sortable: false
				},
				roundStart: {
					name: "起始時間",
					sortable: false
				},
				roundEnd: {
					name: "結束時間",
					sortable: false
				}
			},
			list: [],
			options: { 
				tenderMap: {}
			}
		};
	},
	computed: {},
	watch: {},
	created() {
		getTenderMap().then(response => {
			this.options.tenderMap = response.data.tenderMap;
			if(Object.keys(this.options.tenderMap).length > 0) {
				if(!Object.keys(this.options.tenderMap).includes(String(this.listQuery.tenderId))) this.listQuery.tenderId = Object.keys(this.options.tenderMap)[0];
				this.getList();
			}
		});
	},
	mounted(){
		this.dialogMapVisible = false;
	},
	methods: {
		checkPermission,
		getList() {
			this.loading = true;
			this.list = [];

			getTenderRound({ tenderId: this.listQuery.tenderId }).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.total = 0;
				} else {
					this.list = response.data.list;
					this.list.forEach(l => {
						l.roundStart = this.formatTime(l.roundStart);
						l.roundEnd = this.formatTime(l.roundEnd);
						this.$set(l, "blockId", "");
						this.$set(l, "roadName", "");
						this.$set(l, "edit", false);
					});
				}
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		setRoundTime(row) {
			this.$confirm(`確定修改Round${row.round}的區間為${row.roundStart} - ${row.roundEnd}?`, "確認", {
					showClose: false,
				}).then(() => {
				setTenderRound( { tenderId: row.tenderId, round: row.round, timeStart: row.roundStart, timeEnd: row.roundEnd } ).then(response => {
					if (response.statusCode == 20000 ) {
						this.$message({
							message: "修改成功",
							type: "success",
						});
						this.getList();
					} else {
						this.$message({
							message: "修改失敗",
							type: "error",
						});
					}
				}).catch(err => {
					console.log(err);
					this.getList();
				});
			})
		},
		calPCI(timeStart, timeEnd) {
			resetPCI({ tenderId: this.listQuery.tenderId, timeStart, timeEnd: moment(timeEnd).add(1, "d").format("YYYY-MM-DD") }).then(response => {
				if (response.statusCode == 20000 ) {
					this.$message({
						message: "重置成功",
						type: "success",
					});
				} 
			}).catch(err => console.log(err));
		},
		calPCISpec(blockId, timeStart, timeEnd, pciValue) {
			if(!Number(blockId)) {
				this.$message({
					message: "請輸入正確區塊Id",
					type: "error",
				});
				blockId = "";
			} else {
				updatePCI({ tenderId: this.listQuery.tenderId, pciValue, blockId, timeStart, timeEnd: moment(timeEnd).add(1, "d").format("YYYY-MM-DD") }).then(response => {
					if (response.statusCode == 20000 ) {
						const action = pciValue == 0 ? '重算' : pciValue == -1 ? '重置' : '滿值';
						this.$message({
							message: `${action}成功`,
							type: "success",
						});
					} 
				}).catch(err => console.log(err))
			}
		},
		calPCIRoad(roadName, timeStart, timeEnd, pciValue) {
			if(roadName.length == 0) {
				this.$message({
					message: "請輸入路名",
					type: "error",
				});
			} else {
				updatePCIByName({ tenderId: this.listQuery.tenderId, pciValue, roadName, timeStart, timeEnd: moment(timeEnd).add(1, "d").format("YYYY-MM-DD") }).then(response => {
					if (response.statusCode == 20000 ) {
						const action = pciValue == 0 ? '重算' : pciValue == -1 ? '重置' : '填滿';
						this.$message({
							message: `${action}成功`,
							type: "success",
						});
					} 
				}).catch(err => console.log(err))
			}
		},
		formatter(row, column) {
			if (Number(row[column.property])) return row[column.property].toLocaleString();
			else return row[column.property] || "-";
		},
		formatTime(time) {
			return moment(time).utc().format("YYYY-MM-DD");
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.PCI-Manager
	.filter-container .filter-item .select-contract .el-select
		&.tender-select
			width: 520px
		.el-input__inner
			border-top-left-radius: 0
			border-bottom-left-radius: 0
			padding-left: 10px
			text-align: left
	.btn-action
		margin-left: 5px
		padding: 5px
	.el-table
		.el-icon-success
			margin-right: -10px
		.el-icon-error
			color: #F56C6C
</style>