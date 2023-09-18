<template>
	<div class="app-container cost-kit-V0" v-loading="loading">
		<h2>計價套組_V0</h2>
		<div class="filter-container">
			<div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>合約</span>
					</div>
					<el-select v-model="listQuery.dteamSN" class="tender-select" popper-class="type-select tender" placeholder="請選擇">
						<el-option v-for="(name, id) in options.tenderMap" :key="id" :value="id" :label="name" />
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
			<el-table-column label="備註" min-width="150px" align="center">
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
			</el-table-column>

			<el-table-column label="動作" align="center">
				<template slot-scope="{ row }">
					<el-button type="primary" style="margin-left: 10px" size="mini" @click="beforeEdit(row)">修改</el-button>
					<el-button type="danger" size="mini" @click=" rowActive = row; showConfirm = true;">刪除</el-button>
				</template>
			</el-table-column>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />

		<!-- Dialog: 新增套組 -->
		<el-dialog width="400px" title="新增套組" :visible.sync="showAddKit">
			<el-input v-model="newKit.kitName" maxlength="16" show-word-limit>
				<span slot="prepend">套組名稱</span>
			</el-input>
			<div slot="footer" class="dialog-footer">
				<el-button @click="showAddKit = false">取消</el-button>
				<el-button type="primary" @click="addKit()">確定</el-button>
			</div>
		</el-dialog>

		<!-- Dialog: 修改套組-->
		<el-dialog width="900px" title="修改套組" :visible.sync="rowActive.editKit">
			<div class="detail-caption title" slot="title">套組名稱: {{ rowActive.kitName }}</div>
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
					:min-width="['itemName'].includes(key) ? 100 : ['itemId', 'unit', 'uPrice'].includes(key) ? 18 : 30"
					:label="value.name"
					align="center"
					:sortable="value.sortable"
				>
					<template slot-scope="{ row, column }">
						<span v-if="['number'].includes(column.property)" style="display: inline-flex; align-items: center;">
							<span v-if="row.isEdit || row.editItem">
								<el-input v-model="row[column.property]" size="mini" style="width: 55px"/>
								<el-button v-if="row.editItem" class="btn-dialog" type="info" size="mini" @click="row.editItem = false;">取消</el-button>
							</span>
							<span v-else>
								<span>{{ row[column.property] }}</span>
								<el-button type="text" style="margin-left: 10px" size="mini" @click="row.editItem = true">
									<i class="el-icon-edit" />
								</el-button>
							</span>
						</span>
						<span v-else-if="['itemId'].includes(column.property) && row.isEdit">
							<span v-if="row.isEdit || row.editItem">
								<el-input v-model="row[column.property]" size="mini" />
								<el-tooltip v-if="column.property == 'itemId' && row[column.property].length != 0" effect="dark" placement="bottom" content="點選代入">
									<el-button type="text" @click="getKitItem(row)">
										<i class="el-icon-check" style="color: #67C23A" />
									</el-button>
								</el-tooltip>
							</span>
						</span>
						<span v-else>{{ row[column.property] }}</span>
					</template>
				</el-table-column>
				<el-table-column label="動作" align="center" :min-width="30">
					<template slot-scope="{ row, $index }">
						<span v-if="row.isEdit">
							<el-button type="success" size="mini" @click="addKitItem">新增</el-button>
						</span>
						<span v-else-if="row.editItem">
							<el-button type="primary" size="mini" @click="row.editItem = false;">確定</el-button>
						</span>
						<span v-else>
							<el-button type="danger" size="mini" @click="delKitItem($index)">刪除</el-button>
						</span>
					</template>
				</el-table-column>
			</el-table>
			<div class="detail-caption amount">設計數量金額合計: ${{ detailAmount.toLocaleString() }}</div>
			<div class="detail-note">
				<el-input placeholder="請輸入" v-model="rowActive.kitNumber">
					<template slot="prepend">設計施作數量</template>
				</el-input>
				<el-input placeholder="請輸入" v-model="rowActive.kitMethod">
					<template slot="prepend">設計施工方式</template>
				</el-input>
				<el-input placeholder="請輸入" v-model="rowActive.kitLabor">
					<template slot="prepend">設計施作人力</template>
				</el-input>
				<el-input placeholder="請輸入" v-model="rowActive.kitNote">
					<template slot="prepend">備註</template>
				</el-input>
			</div>
			<div slot="footer" class="dialog-footer">
				<el-button @click="rowActive.editKit = false">取消</el-button>
				<el-button type="primary" @click="rowActive.editKit = false; this.showConfirm = true;">確定</el-button>
			</div>
		</el-dialog>

		<!-- Dialog: 確認-->
		<el-dialog width="300px" title="確認" :visible.sync="showConfirm">
			<span>是否刪除{{ rowActive.serialno }} - {{ rowActive.kitName }} </span>
			<div slot="footer" class="dialog-footer">
				<el-button @click="showConfirm = false">取消</el-button>
				<el-button type="primary" @click="editKit()">確定</el-button>
			</div>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getTenderMap, getKitItemMapV0 } from "@/api/type";
import { getCostKitV0, getCostKitDetailV0 } from "@/api/dispatchV0";
// import TimePicker from "@/components/TimePicker";
import Pagination from "@/components/Pagination";

export default {
	name: "costKitV0",
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
				dteamSN: null,
				pageCurrent: 1,
				pageSize: 50,
			},
			headers: {
				serialno: {
					name: "編號",
					sortable: true,
				},
				kitName: {
					name: "套組名稱",
					sortable: true,
				},
				reccreatetime: {
					name: "建立時間",
					sortable: true,
				},
				// note: {
				// 	name: "備註",
				// 	sortable: false,
				// },
			},
			detailHeaders: {
				itemId: {
					name: "項次",
					sortable: false,
				},
				itemName: {
					name: "工程項目名稱",
					sortable: false,
				},
				unit: {
					name: "單位",
					sortable: false,
				},
				uPrice: {
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
				kitName: ""
			},
			newItem: {
				itemId: "",
				itemName: "",
				unit: "",
				uPrice: "",
				number: 0,
				isEdit: true
			},
			rowActive: {},
			options: {
				tenderMap: {}
			}
		};
	},
	computed: {
		detailPlus() {
			return [ ...this.detail, this.newItem ]
		},
		detailAmount() {
			return this.detailPlus.reduce((acc, cur) => (acc+=cur.number*Number(cur.uPrice)), 0)
		}
	},
	watch: { },
	created() { 
		getTenderMap().then(response => { this.options.tenderMap = response.data.tenderMap});
	},
	methods: {
		getList() {
			// let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			// let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			// this.searchRange = startDate + " - " + endDate;
			
			if (!this.listQuery.dteamSN) {
				this.$message({
					message: "請選擇合約",
					type: "error",
				});
			} else {
				this.loading = true;
				this.list = [];
				getCostKitV0({
					dteamSN: this.listQuery.dteamSN,
					pageCurrent: this.listQuery.pageCurrent,
					pageSize: this.listQuery.pageSize
				}).then((response) => {
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
							l.reccreatetime = this.formatTime(l.reccreatetime);
							this.$set(l, "kitNote", "");
							this.$set(l, "editKit", false);
							this.$set(l, "editNote", false);
						})
					}
					this.loading = false;
				}).catch(err => this.loading = false);
			}
		},
		addKit() {
			console.log(this.newKit);
			this.newKit.kitName = "";
		},
		beforeEdit(row) {
			this.rowActive = row; 
			this.loading = true;

			this.detail = [];
			Object.assign(this.newItem, { itemId: "", itemName: "", unit: "", uPrice: "", number: 0, isEdit: true });
			
			getCostKitDetailV0({
				kitSN: this.rowActive.serialno,
			}).then((response) => {
				this.detail = response.data.list;
				this.detail.forEach(l => {
					this.$set(l, "editItem", false);
				})
				this.loading = false;
				this.rowActive.editKit = true;
			}).catch(err => this.loading = false);
		},
		async getKitItem(row) {
			return new Promise(resolve => {
				this.loading = true;
				const rowActive = row.serialno != undefined ? row : this.newItem;
				Object.assign(rowActive, { itemName: "", unit: "", uPrice: "" });

				getKitItemMapV0({
					tenderId: this.listQuery.dteamSN,
					itemId: rowActive.itemId,
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
			if(!this.newItem.itemId) {
				this.$message({
					message: "請填入正確項次",
					type: "error",
				});

				return;
			}

			await this.getKitItem(this.newItem);

			if(!this.newItem.itemName || !this.newItem.unit || !this.newItem.uPrice || this.newItem.number == 0) {
				const itemText = this.newItem.number == 0 ? "數量" : "項次";
				this.$message({
					message: `請填入正確${itemText}`,
					type: "error",
				});
			} else {
				this.newItem.isEdit = false;
				this.detail.push({...this.newItem, editItem: false});

				Object.assign(this.newItem, { itemId: "", itemName: "", unit: "", uPrice: "", number: 0, isEdit: true });
			}
		},
		delKitItem(index) {
			this.detail.splice(index, 1);
		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD HH:MM:ss");
		},
		async handleDownload() {
			// await this.dateWatcher();

			// const startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			// const endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");

			getRoadUnit({
				pageCurrent: 1,
				pageSize: this.total
			}).then((response) => {
				let list = response.data.list;
				list.forEach(l => l.dist = this.districtList[l.zip].name);

				const tHeader = Object.values(this.headers).map((h) => h.name);
				const filterVal = Object.keys(this.headers);
				// tHeader = [ "日期", "星期", "DAU", "新增帳號數", "PCU", "ACU", "儲值金額", "DAU帳號付費數", "DAU付費率", "DAU ARPPU", "DAU ARPU", "新增帳號儲值金額", "新增帳號付費數", "新增付費率", "新增帳號ARPPU", "新增帳號ARPU" ]
				// filterVal = [ "date", "weekdayText", "dau", "newUser", "pcu", "acu", "amount", "dauPaid", "dauPaidRatio", "dauARPPU", "dauARPU", "newUserAmount", "newUserPaid", "newUserPaidRatio", "newUserARPPU", "newUserARPU" ]
				const data = this.formatJson(filterVal, list);

				import("@/vendor/Export2Excel").then((excel) => {
					excel.export_json_to_excel({
						header: tHeader,
						data,
					});
				});
			});
		},
		formatJson(filterVal, jsonData) {
			return jsonData.map((v) => filterVal.map((j) => v[j]));
		},
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.cost-kit-V0
	.filter-container
		.filter-item
			margin-right: 5px
			.tender-select
				width: 520px
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
	.btn-dialog
		padding: 5px 5px
</style>