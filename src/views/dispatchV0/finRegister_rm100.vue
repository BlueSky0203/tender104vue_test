<template>
	<div class="app-container finish-register-V0" v-loading="loading">
		<h2>完工登錄_V0</h2>
		<div class="filter-container">
			<div class="filter-item">
				<!-- TODO: 設施未完成 -->
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>類型</span>
					</div>
					<el-select v-model.number="listQuery.deviceType" placeholder="請選擇" popper-class="type-select" style="width: 100px">
						<el-option v-for="(name, id) in options.deviceType" :key="id" :value="Number(id)" :label="name" />
					</el-select>
				</div>
			</div>

			<div class="filter-item">
				<div v-if="listQuery.filterType == 1" class="select-contract">
					<el-select v-model="listQuery.filterType" popper-class="type-select">
						<el-option v-for="(name, type) in options.filterType" :key="type" :label="name" :value="Number(type)" />
					</el-select>
					<el-select v-model="listQuery.dteamSN" class="tender-select" placeholder="請選擇" popper-class="type-select tender" clearable @clear="listQuery.dteamSN = null">
						<el-option v-for="(name, id) in options.DteamMap" :key="id" :value="id" :label="name" />
					</el-select>
				</div>
				
				<el-input
					v-else
					v-model="listQuery.filterStr"
					placeholder="請輸入"
					style="width: 300px"
				>
					<el-select slot="prepend" v-model="listQuery.filterType" popper-class="type-select">
						<el-option v-for="(name, type) in options.filterType" :key="type" :label="name" :value="Number(type)" />
					</el-select>
				</el-input>
			</div>
			
			<!-- <div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>合約</span>
					</div>
					<el-select v-model="listQuery.dteamSN" class="tender-select" placeholder="請選擇" popper-class="type-select tender">
						<el-option v-for="(name, id) in options.DteamMap" :key="id" :value="id" :label="name" />
					</el-select>
				</div>
			</div> -->

			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList();">搜尋</el-button>
			<!-- <el-button class="filter-item" type="info" icon="el-icon-document" :circle="screenWidth < 567" @click="handleDownload">輸出列表</el-button> --> 
		</div>

		<h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5>

		<div class="filter-container">
			<div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>廠商</span>
					</div>
					<el-select v-model.number="listQuery.contractor" placeholder="請選擇" popper-class="type-select" style="width: 100px">
						<el-option v-for="(name, id) in options.guildMap" :key="id" :value="Number(id)" :label="name" />
					</el-select>
				</div>
			</div>
			<el-tooltip effect="dark" content="請選擇廠商和案件" placement="bottom" :disabled="tableSelect.length != 0 && Number(listQuery.contractor) > 0">
				<span>
					<el-button class="filter-item" type="success" icon="el-icon-s-claim" :disabled="tableSelect.length == 0 || Number(listQuery.contractor) == 0" @click="showAddKit = true">完工登錄</el-button>
				</span>
			</el-tooltip>
		</div>

		<el-table
			ref="planTable"
			empty-text="目前沒有資料"
			:data="list"
			:key="deviceTypeNow"
			border
			fit
			highlight-current-row
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			stripe
			style="width: 100%"
			@selection-change="handleCheckedChange"
		>
			<el-table-column type="selection" width="60" align="center" fixed>
				<template slot-scope="{ row, $index }">
					<el-checkbox v-model="checkList[$index]" style="margin-right: 5px" @change="cellCheckBox(row, $index)" />
					<span>{{ $index + 1 }}</span>
				</template>
			</el-table-column>
			<!-- <el-table-column type="index" label="序號" width="50" align="center" /> -->
			<el-table-column prop="CType1NO" label="派工單號" width="125" align="center" fixed sortable>
				<template slot-scope="{ row }">
					<span v-if="deviceTypeNow == 1">{{ row.CType1NO }}</span>
					<span v-else-if="deviceTypeNow == 2">{{ row.CType4No }}</span>
					<span v-else-if="deviceTypeNow == 3">{{ row.CType1NO }}</span>
					<span v-else-if="deviceTypeNow == 4">{{ row.SCType1NO }}</span>
					<span v-else> - </span>
				</template>
			</el-table-column>
			<el-table-column prop="CaseNo" label="案件編號" width="130" align="center" fixed sortable>
				<template slot-scope="{ row }">
					<span>{{ row.CaseSN }}</span>
					<br>
					<span>{{ row.CaseNo }}</span>
					<br>
					<span style="color: #909399; font-size: 12px">{{ row.DName }} ({{ row.CaseType }})</span>
				</template>
			</el-table-column>

			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:min-width="['CaseName'].includes(key) ? 80 : null"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="[ 'SCType1Flag' ].includes(column.property)">
						<span v-if="row[column.property] == '3'">已完工</span>
						<span v-else-if="row[column.property] == '2'">已分派</span>
						<el-checkbox v-else v-model="row[column.property]" :true-label="1" :false-label="0" />
					</span>
					<span v-else>
						<span>{{ row[column.property] || "-" }}</span>
					</span>
				</template>
			</el-table-column>

			<!-- 道路、熱再生 -->
			<el-table-column v-if="[1,2].includes(deviceTypeNow)" label="算式" width="400" align="center">
				<template slot-scope="{ row }">
					<el-row v-if="row.accountflag == '1'" :gutter="5" type="flex" align="middle">
						<el-col :span="4"><el-tag class="btn-tag" type="success" @click="row.accountflag = '0'; calArea(row);">自訂</el-tag></el-col>
						<el-col :span="20"><el-input v-model="row.account" @change="calArea(row)" /></el-col>
					</el-row>
					<el-row v-else :gutter="5" type="flex" align="middle">
						<el-col :span="4"><el-tag class="btn-tag" @click="row.accountflag = '1'; calArea(row);">簡單</el-tag></el-col>
						<el-col :span="8"><el-input v-model="row.elength1" @change="calArea(row)" /></el-col>
						<el-col :span="2" style="line-height: 36px"> ✕ </el-col>
						<el-col :span="8"><el-input v-model="row.blength1" @change="calArea(row)" /></el-col>
					</el-row>
				</template>
			</el-table-column>
			<el-table-column v-if="[1,2].includes(deviceTypeNow)" label="面積" width="80" align="center">
				<template slot-scope="{ row }">
					<!-- <el-input v-model="row.acsum0" /> -->
					<span>{{ row.acsum || "-" }}</span>
				</template>
			</el-table-column>

			<!-- 道路 -->
			<el-table-column v-if="deviceTypeNow == '1'" label="完工備註" width="230" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.edit">
						<el-row :gutter="5" v-for="(keyArr, index) in options.workmemoOrder" :key="`memo_${index}`">
							<span v-for="key in keyArr.filter(key => key != 3)" :key="key">
								<el-col :span="6" style="line-height: 32px">{{ options.workmemo[key] }}</el-col>
								<el-col :span="6">
									<el-input v-model="row.memoObj[key]" size="mini" />
								</el-col>
							</span>
						</el-row>
						<el-row :gutter="5">
							<el-col :span="6" style="line-height: 32px">{{ options.workmemo[3] }}</el-col>
							<el-col :span="18">
								<el-input v-model="row.memoObj[3]" size="mini" />
							</el-col>
						</el-row>
						<el-button type="text" @click="rowActive = row">
							<i class="el-icon-success" />
						</el-button>
						<el-button type="text" @click="row.edit = false">
							<i class="el-icon-error" />
						</el-button>
					</span>
					<el-row :gutter="5" v-else>
						<el-col :span="22">
							<span v-if="options.workmemoOrder.flat().filter(key => key != 3 && row.memoObj[key] != 0).length != 0">
								<el-row :gutter="5">
									<span v-for="key in options.workmemoOrder.flat().filter(key => key != 3 && row.memoObj[key] != 0)" :key="key">
										<el-col :span="6">{{ options.workmemo[key] }}</el-col>
										<el-col :span="6">
											<span>{{ row.memoObj[key] }}</span>
										</el-col>
									</span>
								</el-row>
								<el-row v-if="row.memoObj[3].length != 0" :gutter="5">
									<el-col :span="6">{{ options.workmemo[3] }}</el-col>
									<el-col :span="18">
										<span>{{ row.memoObj[3] }}</span>
									</el-col>
								</el-row>
							</span>
							<span v-else> - </span>
						</el-col>
						<el-col :span="2">
							<el-link @click="row.edit = true" style="margin-left: 5px">
								<i class="el-icon-edit" />
							</el-link>
						</el-col>
					</el-row>
				</template>
			</el-table-column>
			<el-table-column v-if="deviceTypeNow == '1'" label="刨鋪深度" width="80" align="center">
				<template slot-scope="{ row }">
					<el-select v-model="row.delmuch" size="mini" popper-class="type-select">
						<el-option v-for="value in [0, 5, 10]" :key="value" :label="value" :value="value"/>
					</el-select>
				</template>
			</el-table-column>
			<el-table-column v-if="deviceTypeNow == '1'" label="使用粒料" width="240" align="center">
				<template slot-scope="{ row }">
					<el-row :gutter="5">
						<el-col :span="6" style="line-height: 28px">粒料3/4</el-col>
						<el-col :span="6">
							<el-select v-model="row.ins1" size="mini" popper-class="type-select">
								<el-option v-for="value in [0, 5, 10]" :key="value" :label="value" :value="value"/>
							</el-select>
						</el-col>
						<el-col :span="6" style="line-height: 28px">粒料3/8</el-col>
						<el-col :span="6">
							<el-select v-model="row.ins2" size="mini" popper-class="type-select">
								<el-option v-for="value in [0, 5, 10]" :key="value" :label="value" :value="value"/>
							</el-select>
						</el-col>
					</el-row>
					<hr>
					<el-checkbox v-model="row.checklai" :true-label="'1'" :false-label="'0'">一級抽料</el-checkbox>
					<el-row :gutter="5">
						<el-col :span="8">
							<el-select v-model="row.checklaitype" size="mini" popper-class="type-select" :disabled="row.checklai == '0'">
								<el-option v-for="value in ['3/8', '3/4']" :key="value" :label="value" :value="value"/>
							</el-select>
						</el-col>
						<el-col :span="8">
							<el-input v-model="row.checklaivalue" size="mini" :disabled="row.checklai == '0'" />
						</el-col>
						<el-col :span="8">
							<el-select v-model="row.checklaitype1" size="mini" popper-class="type-select" :disabled="row.checklai == '0'">
								<el-option v-for="value in ['噸', 'm3']" :key="value" :label="value" :value="value"/>
							</el-select>
						</el-col>
					</el-row>
					<el-checkbox v-model="row.checklai2" :true-label="'1'" :false-label="'0'">二級抽料</el-checkbox>
					<el-row :gutter="5">
						<el-col :span="8">
							<el-select v-model="row.checklai2type" size="mini" popper-class="type-select" :disabled="row.checklai2 == '0'">
								<el-option v-for="value in ['3/8', '3/4']" :key="value" :label="value" :value="value"/>
							</el-select>
						</el-col>
						<el-col :span="8">
							<el-input v-model="row.checklai2value" size="mini" :disabled="row.checklai2 == '0'" />
						</el-col>
						<el-col :span="8">
							<el-select v-model="row.checklai2type1" size="mini" popper-class="type-select" :disabled="row.checklai2 == '0'">
								<el-option v-for="value in ['噸', 'm3']" :key="value" :label="value" :value="value"/>
							</el-select>
						</el-col>
					</el-row>
				</template>
			</el-table-column>

			<!-- 設施 -->
			<el-table-column v-if="deviceTypeNow == 3" label="急件" width="55" align="center">
				<template slot-scope="{ row }">
					<el-checkbox v-model="row.isUrgent" />
				</template>
			</el-table-column>
			<el-table-column v-if="deviceTypeNow == 3" label="工程概述" align="center">
				<template slot-scope="{ row }">
					<el-input v-model="row.c5type" />
				</template>
			</el-table-column>
			
			<el-table-column label="動作" align="center">
				<template slot-scope="{ row }">
					<el-button-group>
						<el-button v-if="deviceTypeNow == 3" size="mini" @click="toggleExpand(row)">詳情</el-button>
						<el-button v-if="deviceTypeNow == 3" type="success" size="mini" @click="beforeEdit(row)">設計</el-button>
						<el-button type="info" size="mini" @click="showDetail(row)">檢視</el-button>
					</el-button-group>
				</template>
			</el-table-column>

			<el-table-column type="expand" width="1" align="center" style="display: none">
				<template slot-scope="props">
				</template>
			</el-table-column>
		</el-table>

		<!-- <pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" /> -->

		<!-- Dialog: 案件檢視 -->
		<el-dialog width="500px" title="案件檢視" :visible.sync="showDetailDialog">
			<case-detail ref="caseDetail" :loading.sync="loading" :showDetailDialog.sync="showDetailDialog" />
			<div slot="footer" class="dialog-footer">
				<!-- <el-button @click="showDispatch = false">取消</el-button> -->
				<el-button type="primary" @click="showDetailDialog = false">確定</el-button>
			</div>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getTenderMap, getGuildMap } from "@/api/type";
import { getFinRegisterV0 } from "@/api/dispatchV0";
import CaseDetail from "@/components/CaseDetail_rm100";
// import Pagination from "@/components/Pagination";

export default {
	name: "finRegisterV0",
	components: { CaseDetail },
	data() {
		return {
			loading: false,
			showDispatch: false,
			showDetailDialog: true,
			showConfirm: false,
			timeTabId: 1,
			dateTimePickerVisible: false,
			screenWidth: window.innerWidth,
			searchRange: "",
			deviceTypeNow: 1,
			listQuery: {
				filterType: 2,
				filterStr: null,
				dteamSN: null,
				deviceType: 1,
				contractor: null,
				// pageCurrent: 1,
				// pageSize: 50,
			},
			headers: {
				// CaseSN: {
				// 	name: "申請單號",
				// 	sortable: true,
				// },
				// CaseNo: {
				// 	name: "案件編號",
				// 	sortable: true,
				// },
				// CaseType: {
				// 	name: "查報來源",
				// 	sortable: false,
				// },
				// DName: {
				// 	name: "案件類型",
				// 	sortable: false,
				// },
				CaseName: {
					name: "案件地點",
					sortable: false
				},
				SCType1Flag: {
					name: "補繪標線",
					sortable: false
				},
				// estWorkingTime: {
				// 	name: "預計施作時段",
				// 	sortable: false
				// },
				// account0: {
				// 	name: "複雜算式",
				// 	sortable: false
				// },
				// elength: {
				// 	name: "預計長度",
				// 	sortable: false
				// },
				// blength: {
				// 	name: "預計寬度",
				// 	sortable: false
				// },
				// acsum0: {
				// 	name: "預估面積",
				// 	sortable: false
				// },
			},
			// total: 0,
			list: [],
			// detail: [],
			rowActive: {},
			checkIndeterminate: false,
			checkList: [],
			tableSelect: [],
			options: {
				DteamMap: {},
				guildMap: {},
				deviceType: {
					1: "道路",
					2: "熱再生",
					3: "設施",
					4: "標線"
				},
				filterType: {
					// 1: "合約",
					2: "派工單號",
					3: "地點(關鍵字)"
				},
				workmemo: {
					1: "堆高機",
					2: "挖土機",
					3: "備註",
					4: "鋪裝機",
					5: "壓路機",
					6: "灑水車"
				},
				workmemoOrder: [ [1, 2], [4, 5], [6], [3] ],

			}
		};
	},
	computed: {	},
	watch: { },
	created() { 
		getTenderMap().then(response => { this.options.DteamMap = response.data.DteamMap });
		getGuildMap().then(response => { this.options.guildMap = response.data.guildMap });
	},
	mounted() {
		this.showDetailDialog = false;
	},
	methods: {
		async handleCheckedChange(val) {
			// const delay = (n) => new Promise( r => setTimeout(r, n*1000));

			// for(const val of value) {
			// 	let msgArr = [];
			// 	for(const column in this.headers) {
			// 		if(!['CaseNo', 'organAssign'].includes(column) && !val[column]) msgArr.push(`「${this.headers[column].name}」`);
			// 	}
			// 	if(msgArr.length > 0) {
			// 		this.$message({
			// 			type: "warning",
			// 			message: `請填入${val.UploadCaseNo}的${msgArr.join("、")}`
			// 		});

			// 		await delay(0.5);
			// 	}
			// }

			this.tableSelect = val;
			if(this.tableSelect.length == this.list.length) this.tableSelect.forEach((_, index) => this.$set(this.checkList, index, true));
			if(this.tableSelect.length == 0) this.checkList = this.checkList.map(() => false);
		},
		cellCheckBox(row, index) {
			if(this.checkList[index]) this.$refs.planTable.toggleRowSelection(row, true);
			else this.$refs.planTable.toggleRowSelection(row, false);
		},
		toggleExpand(row) {
			this.$refs.planTable.toggleRowExpansion(row)
		},
		getList() {
			this.loading = true;
			this.list = [];
			this.listQuery.contractor = null;

			getFinRegisterV0({
				dteamSN: this.listQuery.filterType == 1 ? this.listQuery.dteamSN : null,
				dispatchSN: (this.listQuery.filterType == 2 && this.listQuery.filterStr) ? this.listQuery.filterStr : null,
				keywords: (this.listQuery.filterType == 3 && this.listQuery.filterStr) ? this.listQuery.filterStr : null,
				deviceType: this.listQuery.deviceType,
			}).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.total = 0;
				} else {
					this.list = response.data.list;
					this.checkList = Array.from({ length: this.list.length }, () => false);
					this.deviceTypeNow = this.listQuery.deviceType;

					this.list.forEach(l => {
					// 	l.reccreatetime = this.formatTime(l.reccreatetime);
						this.$set(l, "isUrgent", false);

						let memoObj = { 1: '0', 2: '0', 3: "", 4: '0', 5: '0', 6: '0' }; 
						if(l.workmemo != null) l.workmemo.split("###").forEach(memo => {
							const [ key, value ] = memo.split("@@@");
							memoObj[key] = value;
						});

						this.$set(l, "memoObj", memoObj);
						this.$set(l, "edit", false);
					})
				}
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		showDetail(row) {
			this.loading = true;
			this.$refs.caseDetail.getDetail(row);
		},
		calArea(row) {
			const replaceObj = { " ": "", "＋": "+", "－": "-", "＊": "*", "x": "*", "X": "*", "×": "*", "／": "/", "（": "(", "）": ")",
				"０": '0', "１": "1", "２": "2", "３": "3", "４": "4", "５": "5", "６": "6", "７": "7", "８": "8", "９": "9" };
			// const regex = new RegExp('^[0-9*+\/().-]+$', 'g');
			const regex = /^[^*+/-](?:[*+/\-]?[(]*\d+\.?\d*[)]*)+$/g;
			
			if(row.accountflag == '1') {
				for(const key in replaceObj) row.account = row.account.replaceAll(key, replaceObj[key]);
				row.acsum = regex.test(row.account0) ? Math.round(new Function(`return ${row.account}`)() * 100) / 100 : 0;
			} else row.acsum = Math.round(row.elength1 * row.blength1 * 100) / 100;
		},
		beforeEdit(row) {
			this.rowActive = row; 
			// this.loading = true;

			// this.detail = [];
			// Object.assign(this.newItem, { itemId: "", itemName: "", unit: "", uPrice: "", number: 0, isEdit: true });

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
.finish-register-V0
	.filter-container
		.filter-item
			margin-right: 5px
			.el-select
				width: 110px
				.el-input__inner
					padding-left: 3px
					padding-right: 10px
					text-align: center
				.el-input__suffix
					right: 0
					// margin-right: -5px
					transform: scale(0.7)
				&.tender-select
					width: 520px
			.select-contract
				.el-select:first-child .el-input__inner
					background-color: #F5F7FA
					color: #909399
					border-right: none
					border-top-right-radius: 0
					border-bottom-right-radius: 0
					&:focus
						border-color: #DCDFE6
				.el-select:last-child .el-input__inner
					border-top-left-radius: 0
					border-bottom-left-radius: 0
					padding-left: 10px
					text-align: left
	.el-table
		.input-length, .input-width
			max-width: 60px
		.btn-tag
			cursor: pointer
		.el-table__expand-icon
			display: none
		.el-select
			// width: 85px
			.el-input__inner
				padding-left: 8px
				padding-right: 10px
			.el-input__suffix
				right: 0
				margin-right: -3px
				transform: scale(0.7)
		.el-checkbox
			margin-right: 0
		.el-icon-edit
			color: #67C23A
			margin-bottom: 5px
			&:hover
				color: white
				background-color: #67C23A
				border-radius: 50%
		.el-icon-success
			margin-right: -10px
		.el-icon-error
			color: #F56C6C
	.btn-dialog
		padding: 5px 5px
</style>