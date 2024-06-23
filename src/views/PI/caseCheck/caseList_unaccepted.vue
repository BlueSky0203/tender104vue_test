<template>
	<div class="app-container unaccepted-PI-case-list" v-loading="loading">
		<h2>申覆稽核</h2>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<span class="filter-item">
				<div style="font-size: 12px; color: #909399">通報日期</div>
				<time-picker class="filter-item" :hasWeek="false" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/>
			</span>

			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>
			<el-button
				slot="reference"
				v-if="checkPermission(['PIcase.editor'])"
				class="filter-item"
				type="info"
				icon="el-icon-document"
				:disabled="list.length == 0"
				@click="handleDownload"
			>輸出報表</el-button>
		</div>
		
		<h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5>

		<!-- 資訊列表 -->
		<el-row :gutter="40" class="panel-group">
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-form">
						<svg-icon icon-class="form" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">廠商審核</div>
						<div class="card-panel-num">
							{{ checkNum.MF.check }} <span class="check-num">({{ checkNum.MF.fail }})</span>  / {{ checkNum.MF.total }}
							<el-tooltip class="item" effect="dark" content="不合理案件數 (合理案件數) / 總案件數" placement="bottom"><i class="icon-tooltip el-icon-warning" /></el-tooltip>
						</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-people">
						<svg-icon icon-class="people" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">監造審核</div>
						<div class="card-panel-num"> 
							{{ checkNum.SV.check }} <span class="fail-num">({{ checkNum.SV.fail }})</span> / {{ checkNum.SV.total }}
							<el-tooltip class="item" effect="dark" content="通過案件數 (反對案件數) / 需審核案件數" placement="bottom"><i class="icon-tooltip el-icon-warning" /></el-tooltip>
						</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-domain">
						<svg-icon icon-class="domain" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">機關審核</div>
						<div class="card-panel-num">
							{{ checkNum.Organ.check }} <span class="fail-num">({{ checkNum.Organ.fail }})</span> / {{ checkNum.Organ.total }}
							<el-tooltip class="item" effect="dark" content="通過案件數 (反對案件數) / 需審核案件數" placement="bottom"><i class="icon-tooltip el-icon-warning" /></el-tooltip>
						</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-message-alert">
						<svg-icon icon-class="message-alert" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">通過件數</div>
						<div class="card-panel-num">
							<span> {{ checkNum.pass }}</span>
						</div>
					</div>
				</div>
			</el-col>
		</el-row>
		<br>

		<!-- 審核結果列表 -->
		<el-table
			empty-text="目前沒有資料"
			:data="resultList"
			border
			fit
			highlight-current-row
			:header-cell-style="{'background-color': '#F2F6FC'}"
			stripe
			style="width: 100%"
		>
			<el-table-column label="序號" type="index" width="100" align="center" />
			<el-table-column
				v-for="(value, key) in resultHeader"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:formatter="formatter"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="column.property == 'UploadCaseNo'"> <el-link :href="`https://road.nco.taipei/RoadMis2/web/ViewDefectAllData.aspx?RDT_ID=${row[column.property]}`" target="_blank">{{ row[column.property] }}</el-link></span>
					<span v-else-if="column.property == 'StateNotes'">{{ row.StateNotes.Firm || "-" }}</span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="不通過原因(監造)" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.State & 2">{{ row.StateNotes.SV || "-" }}</span>
					<span v-else> - </span>
				</template>
			</el-table-column>
			<el-table-column label="不通過原因(機關)" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.State & 4">{{ row.StateNotes.Organ || "-" }}</span>
					<span v-else> - </span>
				</template>
			</el-table-column>

			<!-- NOTE: 展示用，還未實作 -->
			<el-table-column label="操作" align="center">
				<template slot-scope="{ row }">
					<el-button class="btn-action" type="info" plain size="mini" round disabled @click="showMap(row)">地圖</el-button>
				</template>
			</el-table-column>
		</el-table>
		<br>

		<!-- 案件列表 -->
		<el-table
			empty-text="目前沒有資料"
			:data="list"
			border
			fit
			highlight-current-row
			:header-cell-style="{'background-color': '#F2F6FC'}"
			stripe
			style="width: 100%"
		>
			<el-table-column label="序號" type="index" width="40" align="center" />
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:width="['StateNotes', 'CaseName'].includes(key) ? 150 : ['CaseDate', 'DeviceType', 'rDeviceType', 'BType', 'BrokeType', 'BrokeStatus', 'DuplicateCase'].includes(key) ? 100 : null"
				:formatter="formatter"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="column.property == 'UploadCaseNo'"> <el-link :href="`https://road.nco.taipei/RoadMis2/web/ViewDefectAllData.aspx?RDT_ID=${row[column.property]}`" target="_blank">{{ row[column.property] }}</el-link></span>
					<span v-else-if="[ 'priorDuplicateCase' ].includes(column.property)">
						<span v-if="row.DuplicateCase!==''">是</span>
						<span v-else>否</span>
					</span>
					<span v-else-if="checkPermission(['PIcase.editor']) && [ 'StateNotes', 'DuplicateCase', 'rDeviceType' ].includes(column.property)">
						<template v-if="row.edit">
							<el-input v-if="column.property == 'StateNotes'" v-model="row.StateNotes.Firm" size="mini" style="width: 100px" />
							<el-select v-else-if="column.property == 'rDeviceType'" v-model.number="row[column.property]" @input="() => $set(list, $index, row)">
								<el-option v-for="(name, type) in options.DeviceType" :key="`${column.property}_${type}`" :label="name" :value="Number(type)" />
							</el-select>
							<el-input v-else v-model="row[column.property]" size="mini" style="width: 100px" />
							<el-button type="text" @click="row.edit = false; rowActive = row; setResult()">
								<i class="el-icon-success" />
							</el-button>
							<el-button type="text" @click="row.edit = false; getList()">
								<i class="el-icon-error" />
							</el-button>
						</template>
						<template v-else>
							<span>{{ formatter(row, column) }}</span>
							<el-link @click="row.edit = true" style="margin-left: 5px">
								<i class="el-icon-edit" />
							</el-link>
						</template>
					</span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
			
			<el-table-column label="廠商審核" width="160px" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.State & 1">合理</span>
					<span v-else-if="row.State & 16" style="color: #67C23A">不合理</span>
					<template v-else-if="checkPermission(['PIcase.editor']) && row.State == 0">
						<el-button-group>
							<el-button v-for="(name, type) in options.resultType.MF" :key="type" :type="type == 1 ? '' : 'success'" size="mini" @click="beforeSetResult(row, Number(type))">{{ name }}</el-button>
						</el-button-group>
					</template>
					<template v-else> - </template>

					<template v-if="checkPermission(['PIcase.editor']) && !(row.State & 2) && !(row.State & 32) && ((row.State & 1) || (row.State & 16))">
						<el-button class="btn-revoke" size="mini" plain round @click="beforeSetResult(row,-1)">撤銷</el-button>
					</template>
				</template>
			</el-table-column>
			<el-table-column label="監造審核" width="160px" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.State & 32" style="color: #67C23A">同意</span>
					<span v-else-if="row.State & 2" style="color: #F56C6C">反對</span>
					<template v-else-if="checkPermission(['PIcase.inspector']) && (row.State & 16)">
						<el-button-group>
							<el-button  :type="'success'" size="mini" @click="beforeSetResult(row, Number(32))">同意</el-button>
							<el-button  :type="'danger'" size="mini" @click="beforeSetResult(row, Number(2))">反對</el-button>
						</el-button-group> 
					</template>
					<template v-else> - </template>

					<template v-if="checkPermission(['PIcase.inspector']) && (!(row.State & 4) && !(row.State & 64)) && ((row.State & 2)||(row.State & 32))">
						<el-button class="btn-revoke" size="mini" plain round @click="beforeSetResult(row,-1)">撤銷</el-button>
					</template>
				</template>
			</el-table-column>
			<el-table-column label="機關審核" width="160px" align="center">
				<template slot-scope="{ row }">
					<span v-if="(row.State & 64)" style="color: #67C23A">同意</span>
					<span v-else-if="(row.State & 4)" style="color: #F56C6C">反對</span>
					<template v-else-if="checkPermission(['PIcase.supervisor']) && ((row.State & 16) && (row.State & 32))">
						<el-button-group>
							<el-button  :type="'success'" size="mini" @click="beforeSetResult(row, Number(64))">同意</el-button>
							<el-button  :type="'danger'" size="mini" @click="beforeSetResult(row, Number(4))">反對</el-button>
						</el-button-group> 
					</template>
					<template v-else> - </template>

					<template v-if="checkPermission(['PIcase.supervisor']) && ((row.State & 4) || (row.State & 64))">
						<el-button class="btn-revoke" size="mini" plain round @click="beforeSetResult(row,-1)">撤銷</el-button>
					</template>
				</template>
			</el-table-column>
			<el-table-column label="是否通過" width="80px" align="center">
				<template slot-scope="{ row }">
					<span v-if="(row.State & 16)&&((row.State & 2)||(row.State & 4))">否</span>
					<span v-else-if="(row.State & 16)&&(row.State & 32) && (row.State & 64)">是</span>
					<span v-else-if="(row.State & 1)"> - </span>
					<span v-else>審核中</span>
				</template>
			</el-table-column>

			<!-- NOTE: 展示用，還未實作 -->
			<el-table-column label="操作" width="80px" align="center">
				<template slot-scope="{ row }">
					<el-button class="btn-action" type="info" plain size="mini" round disabled @click="showMap(row)">地圖</el-button>
				</template>
			</el-table-column>
		</el-table>

		<!-- 抽查結果Dialog -->
		<el-dialog
			:visible.sync="showResultConfirm"
			width="300px"
			:show-close="false"
			:close-on-click-modal="false"
			:close-on-press-escape="false"
			center
		>	
			<span slot="title">確認提交 {{ rowActive.UploadCaseNo }}的審核結果？</span>
			<div>來源案號: {{ rowActive.CaseNo }}</div>
			<div v-if="rowActive.resultType < 0" style="color: #F56C6C">撤銷審核</div>
			<div v-if="(rowActive.resultType != 16) && (rowActive.State & 16)">廠商判定原因: {{ rowActive.StateNotes.Firm || "-" }}</div>
			<div v-if="rowActive.resultType == 1">審核狀態: 合理</div>
			<div v-if="rowActive.resultType == 16">審核狀態: 不合理</div>
			<div v-if="rowActive.resultType == 32 || rowActive.resultType == 64">審核狀態: 同意</div>
			<div v-if="rowActive.resultType == 2 || rowActive.resultType == 4">審核狀態: 反對</div>
			<div v-if="(rowActive.State & 16) && (rowActive.resultType == 16)">原因:
				<el-input v-model="rowActive.StateNotes.Firm" />
			</div>
			<div v-else-if="(rowActive.State & 2)">原因:
				<el-input v-model="rowActive.StateNotes.SV" />
			</div>
			<div v-else-if="(rowActive.State & 4)">原因:
				<el-input v-model="rowActive.StateNotes.Organ" />
			</div>
			<span slot="footer" class="footer-btns">
				<el-button @click="showResultConfirm = false; getList();">取消</el-button>
				<el-button type="primary" :loading="loading" @click="setResult()">確定</el-button>
			</span>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getTypeMap } from "@/api/type";
import { getCaseList, setCaseList } from "@/api/PI";
import checkPermission from '@/utils/permission';
import TimePicker from '@/components/TimePicker';
import { dateWatcher } from "@/utils/pickerOptions";

export default {
	name: "PICaseList_unaccepted",
	components: { TimePicker },
	data() {
		return {
			loading: false,
			timeTabId: 1,
			showResultConfirm: false,
			showUnacceptedConfirm: false,
			dateRange: [ moment().subtract(1, 'month').startOf("month").toDate(), moment().subtract(1, 'month').endOf("month").toDate() ],
			searchRange: "",
			zipCodeNow: 0,
			listQuery: {
				zipCode: 104
			},
			resultHeader: {
				UploadCaseNo: {
					name: "案件編號",
					sortable: true
				},
				StateNotes: {
					name: "判定原因",
					sortable: false
				}
			},
			headers: {
				UploadCaseNo: {
					name: "案件編號",
					sortable: true
				},
					DistressSrc: {
					name: "查報來源",
					sortable: false
				},
				// CaseDate: {
				// 	name: "成案日期",
				// 	sortable: false,
				// },
				ReportDate: {
					name: "通報日期",
					sortable: false,
				},
				DeviceType: {
					name: "設施類型",
					sortable: true
				},
				rDeviceType: {
					name: "認列類型",
					sortable: true
				},
				// organAssign: {
				// 	name: "機關交辦",
				// 	sortable: false
				// },
				CaseName: {
					name: "地址",
					sortable: false
				},
				CaseNo: {
					name: "來源案號",
					sortable: true
				},
				// CaseType: {
				// 	name: "損壞情況",
				// 	sortable: false
				// },
				BType: {
					name: "損壞態樣",
					sortable: false
				},
				BrokeType: {
					name: "損壞程度",
					sortable: false
				},
				// BrokeStatus: {
				// 	name: "損壞狀況",
				// 	sortable: false
				// },
				// PCIValue: {
				// 	name: "PCI",
				// 	sortable: false
				// },
				priorDuplicateCase:{
					name: "優先於民眾查報",
					sortable: false
				},
				DuplicateCase:{
					name: "佐證案件",
					sortable: false
				},
				StateNotes: {
					name: "判定原因",
					sortable: false
				},
				// State: {
				// 	name: "廠商審核",
				// 	sortable: false
				// }
			},
			list: [],
			resultList: [],
			rowActive: {},
			districtList: {
				// 100: {
				// 	"name": "中正區"
				// },
				103: {
					"name": "大同區",
					"start": "2023/2/1"
				},
				104: {
					"name": "中山區",
					"start": "2022/6/1"
				},
				// 105: {
				// 	"name": "松山區"
				// },
				// 106: {
				// 	"name": "大安區"
				// },
				// 108: {
				// 	"name": "萬華區"
				// },
				// 110: {
				// 	"name": "信義區"
				// },
				// 111: {
				// 	"name": "士林區"
				// },
				// 112: {
				// 	"name": "北投區"
				// },
				// 114: {
				// 	"name": "內湖區"
				// },
				// 115: {
				// 	"name": "南港區"
				// },
				// 116: {
				// 	"name": "文山區"
				// }
			},
			options: {
				DeviceType: {},
				BType: {},
				BrokeType: {
					1: "輕",
					2: "中",
					3: "重"
				},
				// BrokeStatus: {
				// 	1: "觀察", //輕度
				// 	2: "短期改善", //中度
				// 	3: "立即改善", //重度
				// },
				resultType: {
					MF:{
						1: "合理",
						16: "不合理"
					},
					SV: {
						32: "同意",
						2: "反對"
					},
					Organ: {
						64: "同意",
						4: "反對"
					}
				},
			}
		};
	},
	computed: { 
		checkNum() {
			return { 
				MF: {
					check: this.list.filter(l => l.State & 16).length, 
					fail: this.list.filter(l => l.State & 1).length,
					total: this.list.length
				},
				SV: { 
					check: this.list.filter(l => l.State & 32).length, 
					fail: this.list.filter(l => l.State & 2).length,
					total: this.list.filter(l => l.State & 16).length
				}, 
				Organ: { 
					check: this.list.filter(l =>  l.State & 64).length, 
					fail: this.list.filter(l => l.State & 4).length,
					total: this.list.filter(l => (l.State & 16) && (l.State & 32)).length
				},
				// pass: this.list.filter(l =>  (l.State & 2) && (l.State & 4)).length
				pass: this.list.filter(l => (l.State & 16) && (l.State & 32) && (l.State & 64)).length
			
			};
		}
	},
	created() {
		getTypeMap().then(response => {
			this.options.DeviceType = response.data.DeviceTypeMap;
			this.options.BType = response.data.BTypeMap;
		});
		this.getList();
	},
	methods: {
		checkPermission,
		getList() {
			this.loading = true;
			dateWatcher(this.districtList[this.listQuery.zipCode].start, this.dateRange);
			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;
			this.list = [];

			getCaseList({
				filterType: 2,
				caseType: 2,
				zipCode: this.listQuery.zipCode,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD")
			}).then((response) => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.zipCodeNow = this.listQuery.zipCode;
					this.list = response.data.list;
					this.resultList = response.data.resultList;
					this.list.forEach(l => {
						// if(l.StateNotes.length==0)l.StateNotes={}
						for(const key of ["Firm", "SV", "Organ"]) {
							if(!l.StateNotes.hasOwnProperty(key)) this.$set(l.StateNotes, key, "");
						}
						
						this.$set(l, "edit", false);
					})
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		beforeSetResult(row, result) {
			this.rowActive = JSON.parse(JSON.stringify(row));
			this.rowActive.resultType = result;
			if(result == -1) {
				if(this.rowActive.State & 64){
					this.rowActive.State -= 64;
				} 
				else if((this.rowActive.State & 16) && (this.rowActive.State & 32) && (this.rowActive.State & 4)){
					this.rowActive.State -= 4;
					this.rowActive.StateNotes.Organ = '';
				} 
				else if(this.rowActive.State & 32){
					this.rowActive.State -= 32;
				}
				else if((this.rowActive.State & 16)&&(this.rowActive.State & 2)){
					this.rowActive.State -= 2;
					this.rowActive.StateNotes.SV = '';
				}
				else if(this.rowActive.State & 16) this.rowActive.State -= 16;
				else if((this.rowActive.State & 1)) this.rowActive.State -= 1;
				// row.State == 0
			} else this.rowActive.State += result;
			this.showResultConfirm = true;
		},
		setResult() {
			this.loading = true;
			this.showUnacceptedConfirm = false;
			this.showResultConfirm = false;

			if(this.rowActive.State == 0) this.rowActive.StateNotes.Firm = '';

			setCaseList( this.rowActive.id, {
				zipCode: this.zipCodeNow,
				rDeviceType: this.rowActive.rDeviceType,
				organAssign: this.rowActive.organAssign,
				BType: this.rowActive.BType,
				BrokeType: this.rowActive.BrokeType,
				PCIValue: this.rowActive.PCIValue,
				State: this.rowActive.State,
				StateNotes: JSON.stringify(this.rowActive.StateNotes),
				DuplicateCase: this.rowActive.DuplicateCase
			}).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "提交成功",
						type: "success",
					});
					this.getList();
				} 
			}).catch(err => {
				console.log(err);
				this.getList();
			})
		},
		formatter(row, column) {
			if([ 'organAssign', 'State' ].includes(column.property)) return row[column.property] == 1 ? '是' : '-';
			else if(['DeviceType', 'rDeviceType'].includes(column.property)) return this.options.DeviceType[row[column.property]];
			else if(column.property == 'BType') return this.options.BType[row[column.property]];
			else if(column.property == 'BrokeType') return this.options.BrokeType[row[column.property]];
			// else if(column.property == 'BrokeStatus') return this.options.BrokeStatus[row.BrokeType];
			else if(column.property == 'StateNotes') return row.StateNotes.Firm || "-";
			else if(column.property.indexOf('Date') != -1) return row[column.property] ? this.formatTime(row[column.property]) : "-";
			else if(column.property.indexOf('Area') != -1) return Number(row[column.property]) ? row[column.property].toLocaleString() : "-";
			else return row[column.property] && row[column.property] != '0' ? row[column.property] : "-";
		},
		formatTime(time) {
			return moment(time).format("YYYY/MM/DD");
		},
		handleDownload() {
			const tHeader = Object.values(this.headers).map(value => value.name).concat(["廠商審核","監造審核", "機關審核", "通過"]);
			const filterVal = Object.keys(this.headers).concat(["MFCheck", "SVCheck", "OrganCheck", "Pass"]);
			// tHeader = [ "日期", "星期", "DAU", "新增帳號數", "PCU", "ACU", "儲值金額", "DAU帳號付費數", "DAU付費率", "DAU ARPPU", "DAU ARPU", "新增帳號儲值金額", "新增帳號付費數", "新增付費率", "新增帳號ARPPU", "新增帳號ARPU" ];
			// filterVal = [ "date", "weekdayText", "dau", "newUser", "pcu", "acu", "amount", "dauPaid", "dauPaidRatio", "dauARPPU", "dauARPU", "newUserAmount", "newUserPaid", "newUserPaidRatio", "newUserARPPU", "newUserARPU" ];
			const dataList = JSON.parse(JSON.stringify(this.list)).map(l => {
				l.CaseDate = this.formatTime(l.CaseDate);
				l.ReportDate = this.formatTime(l.ReportDate);
				l.DeviceType = this.options.DeviceType[l.DeviceType];
				l.rDeviceType = this.options.DeviceType[l.rDeviceType];
				l.organAssign =  l.organAssign == 1 ? "是" : "";
				l.BType = this.options.BType[l.BType];
				l.BrokeType = this.options.BrokeType[l.BrokeType];
				// l.BrokeStatus = this.options.BrokeStatus[l.BrokeType];
				l.priorDuplicateCase = l.DuplicateCase?"是":"否"
				l.MFCheck = (l.State & 16) ? "V" : (l.State & 1) ? "X" : "-";
				l.SVCheck = (l.State & 2) ? "X" : (l.State & 32) ? "V" : "-";
				l.OrganCheck = (l.State & 4) ? "X" : (l.State & 64) ? "V" :  "-";
				l.Pass = (l.State & 32) && (l.State & 64) ? "V" : (l.State & 2) || (l.State & 4) ? "X" : "-";
				l.StateNotes = l.StateNotes.Firm;
				return l
			}) 
			const data = this.formatJson(filterVal, dataList);

			import("@/vendor/Export2Excel").then((excel) => {
				excel.export_json_to_excel({
					header: tHeader,
					data,
				});
			});
			this.getList();
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
.unaccepted-PI-case-list
	height: calc(100vh - 50px)
	overflow: scroll
	.filter-container 
		.el-select
			width: 110px
		.el-input__inner
			padding-left: 5px
			text-align: center
		.filter-item
			margin-right: 5px
		.time-picker 
			& > *
				margin-right: 5px
			.el-date-editor.el-input
				width: 165px
				.el-input__inner
					width: 155px
					padding: 0 10px
	.panel-group 
		position: sticky
		top: -20px
		display: flex
		align-items: center
		background-color: rgba(#fff, 1)
		box-shadow: 0 5px 5px rgba(#eee, 0.1)
		width: calc(100% + 40px)
		margin: 0 !important
		transform: translateX(-15px)
		padding: 5px
		// margin: 5px 0
		// margin-top: 18px
		z-index: 2
		.card-panel-col 
			position: relative
			margin: auto
		.card-panel 
			height: 125px
			font-size: 12px
			position: relative
			// overflow: hidden
			color: #666
			background: #fff
			box-shadow: 4px 4px 40px rgba(0, 0, 0, .05)
			border-color: rgba(0, 0, 0, .05)
			display: flex
			justify-content: space-around
			align-items: center
			&:hover 
				.card-panel-icon-wrapper 
					color: #fff
				.icon-form
					background: #40c9c6
				.icon-people
					background: #36a3f7
				.icon-domain
					background: #FF9800
				.icon-message-alert
					background: #f4516c
			.icon-form
				color: #40c9c6
			.icon-people
				color: #36a3f7
			.icon-domain
				color: #FF9800
			.icon-message-alert
				color: #f4516c
			.card-panel-icon-wrapper 
				float: left
				margin: 14px 0 0 14px
				padding: 16px
				transition: all 0.38s ease-out
				border-radius: 6px
			.card-panel-icon 
				float: left
				font-size: 48px
			.card-panel-description 
				float: right
				font-weight: bold
				margin: 26px
				margin-left: 0px
				.card-panel-text 
					line-height: 18px
					color: rgba(0, 0, 0, 0.45)
					font-size: 16px
					margin-bottom: 12px
				.card-panel-num 
					font-size: 18px
					.check-num
						color: #67C23A
						vertical-align: text-top
					.fail-num
						color: #F56C6C
						vertical-align: text-top

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
	.el-select.edit-select
		width: 85px
		.el-input__inner
			padding-left: 3px
			padding-right: 10px
		.el-input__suffix
			right: 0
			margin-right: -3px
			transform: scale(0.7)
	.edit-number.el-input-number .el-input__inner
		padding: 0 10px
		text-align: left
	.btn-revoke
		padding: 5px 10px
		margin-left: 5px
	.el-dialog
		.el-dialog__body > div
			margin-top: 10px
		.el-select
			margin-top: 5px
			width: 250px
		.footer-btns
			display: flex
			justify-content: center
</style>