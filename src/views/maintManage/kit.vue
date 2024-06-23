<template>
	<div class="app-container cost-kit" v-loading="loading">
		<h2>工法管理</h2>
		<div class="filter-container">
			<el-input v-model="listQuery.filterStr" placeholder="請輸入" style="width: 200px">
				<span slot="prepend">關鍵字</span>
			</el-input>
			<div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>契約</span>
					</div>
					<el-select v-model="listQuery.groupId" class="tender-select" placeholder="請選擇" popper-class="type-select tender" clearable @clear="listQuery.groupId = null">
						<el-option v-for="(obj, id) in options.tenderGroup" :key="id" :value="id" :label="obj.groupName" />
					</el-select>
				</div>
			</div>
			<!-- <time-picker class="filter-item" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/> -->

			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="listQuery.pageCurrent = 1; getList();">搜尋</el-button>
			<el-tooltip class="item" effect="dark" content="請選擇合約並搜尋" placement="bottom" :disabled="list.length != 0">
				<span>
					<el-button class="filter-item" type="success" icon="el-icon-plus" :disabled="list.length == 0" @click="showAddKit = true">新增套組</el-button>
				</span>
			</el-tooltip>
			<!-- <el-button class="filter-item" type="info" icon="el-icon-document" :circle="screenWidth < 567" @click="handleDownload">輸出列表</el-button> --> 
		</div>

		<!-- <h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5> -->

		<el-table
			ref="kitTable"
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
				:sortable="value.sortable"
			/>
			<!-- <el-table-column label="備註" min-width="150px" align="center">
				<template slot-scope="{ row }">
					<template v-if="row.editNote">
						<el-input v-model="row.kitNote" maxlength="16" show-word-limit style="width: 285px" />
						<el-button type="text"  @click=" row.editNote = false; rowActive = row; editNote();">
							<i class="el-icon-success" />
						</el-button>
						<el-button type="text" @click=" row.editNote = false; getList();">
							<i class="el-icon-error" />
						</el-button>
					</template>
					<template v-else>
						<span>{{ row.note || "-" }}</span>
						<el-link @click="row.editNote = true">
							<i class="el-icon-edit" />
						</el-link>
					</template>
				</template>
			</el-table-column> -->

			<el-table-column label="動作" align="center">
				<template slot-scope="{ row }">
					<el-button-group>
						<el-button type="primary" style="margin-left: 10px" size="mini" @click="beforeEdit(row)">修改</el-button>
						<el-button size="mini" @click="toggleExpand(row)">詳情</el-button>
						<el-button type="danger" size="mini" @click="delKit(row)">刪除</el-button>
					</el-button-group>
				</template>
			</el-table-column>

			<el-table-column type="expand" width="1" align="center" style="display: none">
				<template slot-scope="{ row }">
					<span v-if="row.Content.length == 0">目前沒有資料</span>
					<span v-else>
						<el-table
							class="expandTable"
							empty-text="目前沒有資料"
							:data="row.Content"
							border
							fit
							highlight-current-row
							:header-cell-style="{ 'background-color': '#F2F6FC' }"
							stripe
							show-summary
							:summary-method="(param) => getSummaries(param, row.Content)"
							style="width: 100%"
						>
							<el-table-column type="index" label="序號" width="50" align="center" /> 
							<el-table-column
								v-for="(value, key) in detailHeaders"
								:key="key"
								:prop="key"
								:min-width="['TaskName'].includes(key) ? 100 : ['UnitSN', 'TaskUnit', 'TaskPrice'].includes(key) ? 18 : 30"
								:label="value.name"
								align="center"
								:sortable="value.sortable"
							/>
						</el-table>
						<div class="expand-note">
							<!-- <div>金額合計: ${{ detailAmount(row.Content).toLocaleString() || "-" }}</div> -->
							<div>施作數量: {{ row.DesignDetail || "-" }}</div>
							<div>施工方式: {{ row.DesignDesc || "-" }}</div>
							<div>施作人力: {{ row.DesignWorker || "-" }}</div>
						</div>
					</span>
				</template>
			</el-table-column>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />

		<!-- Dialog: 新增套組 -->
		<el-dialog width="400px" title="新增套組" :visible.sync="showAddKit">
			<el-input v-model="newKit.GroupName" maxlength="16" show-word-limit>
				<span slot="prepend">套組名稱</span>
			</el-input>
			<div slot="footer" class="dialog-footer">
				<el-button @click="showAddKit = false">取消</el-button>
				<el-button type="primary" @click="addKit()">確定</el-button>
			</div>
		</el-dialog>

		<!-- Dialog: 修改套組-->
		<el-dialog width="900px" title="修改套組" :visible.sync="rowActive.editKit" :close-on-click-modal="false" :close-on-press-escape="false" :before-close="() => cleanDetail()">
			<div class="detail-caption title" slot="title">套組名稱: {{ rowActive.GroupName }}</div>
			<el-table
				v-loading="loading"
				empty-text="目前沒有資料"
				:data="detailPlus"
				border
				fit
				highlight-current-row
				:header-cell-style="{ 'background-color': '#F2F6FC' }"
				stripe
				style="width: 100%"
			>
				<el-table-column
					v-for="(value, key) in detailHeaders"
					:key="key"
					:prop="key"
					:min-width="['TaskName'].includes(key) ? 100 : ['SerialNo', 'TaskUnit', 'TaskPrice'].includes(key) ? 18 : 30"
					:label="value.name"
					align="center"
					:sortable="value.sortable"
				>
					<template slot-scope="{ row, column }">
						<span v-if="['number'].includes(column.property)" style="display: inline-flex; align-items: center;">
							<span v-if="row.isAdd || row.isEdit">
								<el-input v-model="row[column.property]" size="mini" style="width: 55px">
									<el-button slot="append" v-if="row.isEdit" class="btn-dialog" type="info" size="mini" @click="row.isEdit = false;">取消</el-button>
								</el-input>
							</span>
							<span v-else>
								<span>{{ row[column.property] }}</span>
								<el-button type="text" style="margin-left: 10px" size="mini" @click="row.isEdit = true">
									<i class="el-icon-edit" />
								</el-button>
							</span>
						</span>
						<span v-else-if="['UnitSN'].includes(column.property) && row.isAdd">
							<span v-if="row.isAdd || row.isEdit">
								<el-input v-model="row[column.property]" size="mini">
									<el-tooltip v-if="column.property == 'UnitSN' && row[column.property].length != 0" slot="suffix" effect="dark" placement="bottom" content="點選代入">
										<el-button type="text" style="padding: 2px 0" @click="getKitItem(row)">
											<i class="el-icon-check" style="color: #67C23A"/>
										</el-button>
									</el-tooltip>
								</el-input>
							</span>
						</span>
						<span v-else>{{ row[column.property] }}</span>
					</template>
				</el-table-column>
				<el-table-column label="動作" align="center" :min-width="30">
					<template slot-scope="{ row, $index }">
						<span v-if="row.isAdd">
							<el-button type="success" size="mini" @click="addKitItem">新增</el-button>
						</span>
						<span v-else-if="row.isEdit">
							<el-button type="primary" size="mini" @click="row.isEdit = false;">確定</el-button>
						</span>
						<span v-else>
							<el-button type="danger" size="mini" @click="delKitItem($index)">刪除</el-button>
						</span>
					</template>
				</el-table-column>
			</el-table>
			<div class="detail-caption amount">數量金額合計: ${{ detailAmount(detailPlus).toLocaleString() }}</div>
			<div class="detail-note">
				<el-input placeholder="請輸入" v-model="rowActive.DesignDetail">
					<template slot="prepend">施作數量</template>
				</el-input>
				<el-input placeholder="請輸入" v-model="rowActive.DesignDesc">
					<template slot="prepend">施工方式</template>
				</el-input>
				<el-input placeholder="請輸入" v-model="rowActive.DesignWorker">
					<template slot="prepend">施作人力</template>
				</el-input>
				<!-- <el-input placeholder="請輸入" v-model="rowActive.kitNote">
					<template slot="prepend">備註</template>
				</el-input> -->
			</div>
			<div slot="footer" class="dialog-footer">
				<el-button @click="cleanDetail()">取消</el-button>
				<el-button type="primary" @click="editKit()">確定</el-button>
			</div>
		</el-dialog>

		<!-- Dialog: 確認-->
		<el-dialog width="300px" title="確認" :visible.sync="showConfirm">
			<span>是否刪除{{ rowActive.SerialNo }} - {{ rowActive.GroupName }} </span>
			<div slot="footer" class="dialog-footer">
				<el-button @click="showConfirm = false">取消</el-button>
				<el-button type="primary" @click="delKit()">確定</el-button>
			</div>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getTenderGroup, getKitItemMap } from "@/api/type";
import { getTaskGroup, addTaskGroup, delTaskGroup, getTaskGroupDetail, setTaskGroupDetail } from "@/api/dispatch";
// import TimePicker from "@/components/TimePicker";
import Pagination from "@/components/Pagination";

export default {
	name: "costKit",
	components: { Pagination },
	data() {
		return {
			loading: false,
			showAddKit: false,
			showEditKit: false,
			showConfirm: false,
			// timeTabId: moment().year(),
			// dateTimePickerVisible: false,
			screenWidth: window.innerWidth,
			// dateRange: [
			// 	moment().year(2022).month(5).startOf("month").toDate(),
			// 	moment().endOf("year").toDate(),
			// ],
			// searchRange: "",
			confirmType: 0, //del: 0, add: 1
			listQuery: {
				filterStr: null,
				groupId: null,
				pageCurrent: 1,
				pageSize: 50,
			},
			headers: {
				SerialNo: {
					name: "編號",
					sortable: true,
				},
				GroupName: {
					name: "套組名稱",
					sortable: true,
				},
				CreateTime: {
					name: "建立時間",
					sortable: true,
				},
				// note: {
				// 	name: "備註",
				// 	sortable: false,
				// },
			},
			detailHeaders: {
				UnitSN: {
					name: "項次",
					sortable: false,
				},
				TaskName: {
					name: "工程項目名稱",
					sortable: false,
				},
				TaskUnit: {
					name: "單位",
					sortable: false,
				},
				TaskPrice: {
					name: "單價",
					sortable: false,
				},
				number: {
					name: "數量",
					sortable: false,
				}
			},
			total: 0,
			list: [],
			detail: [],
			newKit: {
				GroupName: ""
			},
			newItem: {
				UnitSN: "",
				TaskName: "",
				TaskUnit: "",
				TaskPrice: "",
				number: 0,
				isAdd: true
			},
			rowActive: {},
			options: {
				tenderGroup: {}
			}
		};
	},
	computed: {
		detailPlus() {
			return [ ...this.detail, this.newItem ]
		}
	},
	watch: { },
	created() { 
		getTenderGroup().then(response => { this.options.tenderGroup = response.data.tenderGroup });
	},
	methods: {
		toggleExpand(row) {
			row.Content = [];
			getTaskGroupDetail({
				groupSN: row.SerialNo,
			}).then(response => {
				row.Content = response.data.list;
				this.loading = false;
				this.$refs.kitTable.toggleRowExpansion(row);

				// 調整總計列欄位
				this.$nextTick(() => {
					// const expandTableSummary = document.querySelectorAll("#expandTable .el-table__footer-wrapper tr>td");
					const expandTableSumList = document.querySelectorAll(".expandTable .el-table__footer-wrapper tr");
					// console.log(expandTableSumList);
					if(expandTableSumList.length != 0) {
						for(const tableList of expandTableSumList) {
							// console.log(tableList);
							const tdList = tableList.getElementsByTagName("td");
							if(tdList.length != 0) {
								tdList[0].colSpan = 4;
								tdList[0].style.textAlign = "center";
								tdList[1].style.display = "none";
								tdList[2].style.display = "none";
								tdList[3].style.display = "none";
								tdList[4].colSpan = 2;
								tdList[4].style.textAlign = "center";
								tdList[5].style.display = "none";
							}
						}
					}
				});
			}).catch(err => this.loading = false);
		},
		detailAmount(content) {
			return content.reduce((acc, cur) => (acc+=cur.number*Number(cur.TaskPrice)), 0)
		},
		getSummaries(param, content) {
			const { columns, data } = param;
			const sums = [];
			columns.forEach((column, index) => {
				if (index === 0) {
					sums[index] = `金額合計`;
					return;
				}
				if(![1,2].includes(index)) {
					if(column.property == "TaskPrice") sums[index] = this.detailAmount(content).toLocaleString();
				}
			});
			return sums;
		},
		getList() {
			// let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			// let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			// this.searchRange = startDate + " - " + endDate;
			
			if (!this.listQuery.groupId) {
				this.$message({
					message: "請選擇契約",
					type: "error",
				});
			} else {
				this.loading = true;
				this.list = [];
				getTaskGroup({
					groupId: this.listQuery.groupId,
					keyword: this.listQuery.filterStr,
					pageCurrent: this.listQuery.pageCurrent,
					pageSize: this.listQuery.pageSize
				}).then(response => {
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
							l.CreateTime = this.formatTime(l.CreateTime);
							this.$set(l, "kitNote", "");
							this.$set(l, "Content", []);
							this.$set(l, "editKit", false);
							this.$set(l, "editNote", false);
						})
					}
					this.loading = false;
				}).catch(err => this.loading = false);
			}
		},
		addKit() {
			this.showAddKit = false;
			addTaskGroup({
				groupName: this.newKit.GroupName,
				groupId: this.listQuery.groupIdId
			}).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "新增成功",
						type: "success",
					});
					this.listQuery.filterStr = this.newKit.GroupName;
					this.newKit.GroupName = "";
					this.getList();
				} else {
					this.$message({
						message: "新增失敗",
						type: "error",
					});
				}
			}).catch(err => {
				console.log(err);
				this.getList();
			})
		},
		editKit() {
			this.$confirm(`確認修改 ${this.rowActive.SerialNo} - ${this.rowActive.GroupName} 套組內容?`, "確認", { showClose: false })
				.then(() => {
					this.rowActive.editKit = false;
					this.detail.forEach(row => {
						row.number == Number(row.number);
						for(const key of [ "SerialNo", "GroupSN", "isAdd", "isEdit", "TaskPrice", "DTeam" ]) delete row[key];
					});
					setTaskGroupDetail({
						serialNo: this.rowActive.SerialNo,
						groupId: this.listQuery.groupId,
						kitContent: this.detail,
						designDetail: this.rowActive.DesignDetail || undefined,
						designDesc: this.rowActive.DesignDesc || undefined,
						designWorker: this.rowActive.DesignWorker || undefined
					}).then(response => {
						if ( response.statusCode == 20000 ) {
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
						this.rowActive.editKit = false;
					}).catch(err => {
						this.rowActive.editKit = false;
						this.getList();
					});
				}).catch(err => {});
		},
		delKit(row) {
			this.$confirm(`確認刪除 ${row.SerialNo} - ${row.GroupName}?`, "確認", { showClose: false } )
				.then(() => {
					delTaskGroup({
						SerialNo: row.SerialNo
					}).then(response => {
						if (response.statusCode == 20000) {
							this.$message({
								message: "刪除成功",
								type: "success",
							});
							this.getList();
						} else {
							this.$message({
								message: "刪除失敗",
								type: "error",
							});
						}
					}).catch(err => this.getList())
				})
		},
		beforeEdit(row) {
			for(const row of this.list) this.$refs.kitTable.toggleRowExpansion(row, false);
			this.rowActive = JSON.parse(JSON.stringify(row)); 
			this.loading = true;

			this.detail = [];
			Object.assign(this.newItem, { UnitSN: "", TaskName: "", TaskUnit: "", TaskPrice: "", number: 0, isAdd: true });
			
			getTaskGroupDetail({
				groupSN: this.rowActive.SerialNo,
			}).then((response) => {
				this.detail = response.data.list;
				this.detail.forEach(l => {
					this.$set(l, "isEdit", false);
				})
				this.loading = false;
				this.rowActive.editKit = true;
			}).catch(err => this.loading = false);
		},
		cleanDetail() {
			this.detail = [];
			this.rowActive = {
				KitNotes: {
					DesignDetail: "",
					DesignDesc: "",
					DesignWorker: ""
				}
			};
			this.rowActive.editKit = false;
		},
		async getKitItem(row) {
			return new Promise(resolve => {
				this.loading = true;
				const rowActive = row.SerialNo != undefined ? row : this.newItem;
				Object.assign(rowActive, { TaskName: "", TaskUnit: "", TaskPrice: "" });

				getKitItemMap({
					tenderId: this.listQuery.tenderId,
					UnitSN: rowActive.UnitSN
				}).then((response) => {
					if (response.data.item == undefined) {
						this.$message({
							message: "查無項次資料",
							type: "error",
						});
					} else {
						Object.assign(rowActive, response.data.item);
					}
					this.loading = false;
					resolve();
				}).catch(err => { this.loading = false; resolve(); });
			})
		},
		async addKitItem() {
			if(!this.newItem.UnitSN) {
				this.$message({
					message: "請填入正確項次",
					type: "error",
				});

				return;
			}

			await this.getKitItem(this.newItem);

			if(!this.newItem.TaskName || !this.newItem.TaskUnit || !this.newItem.TaskPrice || this.newItem.number == 0) {
				const itemText = this.newItem.number == 0 ? "數量" : "項次";
				this.$message({
					message: `請填入正確${itemText}`,
					type: "error",
				});
			} else {
				this.newItem.isAdd = false;
				this.detail.push({...this.newItem, isEdit: false});

				Object.assign(this.newItem, { UnitSN: "", TaskName: "", TaskUnit: "", TaskPrice: "", number: 0, isAdd: true });
			}
		},
		delKitItem(index) {
			this.detail.splice(index, 1);
		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD HH:MM:ss");
		},
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.cost-kit
	.filter-container
		.filter-item
			margin-right: 5px
			.tender-select
				width: 330px
				.el-input__inner
					padding-left: 10px
					text-align: left

	.el-table
		i 
			font-size: 18px
			opacity: 0.8
			vertical-align: baseline
			&.el-icon-edit
				color: #67c23a
				font-size: 14px
				&:hover
					color: white
					background-color: #67c23a
					border-radius: 50%
					transform: scale(1.1)
			&.el-icon-success
				color: blue
				margin-right: -10px
			&.el-icon-error
				color: #F56C6C
	.detail-caption
		width: 100%
		height: 30px
		font-size: 16px
		font-weight: bold
		text-align: center
		line-height: 30px
		&.title
			padding-bottom: 40px
			border-bottom: 1px solid #DFE6EC
		&.amount
			// border: 1px solid #DFE6EC
			background-color: #DFE6EC
			margin: 10px 0 30px 0
	.expand-note 
		padding: 10px 0 0 10px
		& > *
			font-size: 14px
			margin: 5px 0
	.btn-dialog
		padding: 5px 5px
</style>