<template>
	<div class="app-container inspected-case-list" v-loading="loading">
		<h2>案件稽核(環景)</h2>
		<div class="filter-container">
			<div v-if="listQuery.tenderRound > 0" class="filter-item">
				<div class="select-contract el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>合約</span>
					</div>
					<el-select v-model.number="listQuery.tenderRound" class="tender-select" popper-class="type-select tender">
						<el-option v-for="(val, type) in options.tenderRoundMap" :key="type" :label="val.name" :value="Number(type)" />
					</el-select>
				</div>
			</div>
			<el-button v-if="listQuery.tenderRound > 0" type="primary" @click="getList()">搜尋</el-button>

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

		<!-- 資訊列表 -->
		<el-row :gutter="40" class="panel-group">
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-form">
						<svg-icon icon-class="form" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">廠商通報數</div>
						<div class="card-panel-num">{{ total }}</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-people">
						<svg-icon icon-class="people" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">監造抽查 (15%)</div>
						<div class="card-panel-num"> 
							路面: {{ checkNum.SV.AC.check }} <span class="fail-num">({{ checkNum.SV.AC.fail }})</span> / {{ checkNum.SV.AC.total }} 
							<br>
							設施: {{ checkNum.SV.facility.check }} <span class="fail-num">({{ checkNum.SV.facility.fail }})</span> / {{ checkNum.SV.facility.total }}
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
						<div class="card-panel-text">機關抽查 (5%)</div>
						<div class="card-panel-num">
							路面: {{ checkNum.Organ.AC.check }} <span class="fail-num">({{ checkNum.Organ.AC.fail }})</span> / {{ checkNum.Organ.AC.total }} 
							<br>
							設施: {{ checkNum.Organ.facility.check }} <span class="fail-num">({{ checkNum.Organ.facility.fail }})</span> / {{ checkNum.Organ.facility.total }}
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
						<div class="card-panel-text">不合格件數</div>
						<div class="card-panel-num">
							<span> {{ reasonTypeArr[1] }} <el-tooltip class="item" effect="dark" content="損壞情形說明與現況不符(PI1.2)" placement="bottom"><i class="icon-tooltip el-icon-warning" /></el-tooltip></span>	 / 
							<span> {{ reasonTypeArr[2] }} <el-tooltip class="item" effect="dark" content="損壞程度與現況不符(PI2.2)" placement="bottom"><i class="icon-tooltip el-icon-warning" /></el-tooltip></span>
						</div>
					</div>
				</div>
			</el-col>
		</el-row>
		<br>

		<!-- 抽查結果列表 -->
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
					<span v-if="column.property == 'CaseNo'"> <el-link :href="`https://road.nco.taipei/RoadMis2/web/ViewDefectAllData.aspx?RDT_ID=${row[column.property]}`" target="_blank">{{ row[column.property] }}</el-link></span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="不合格原因(監造)" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.PIState & 32">{{ row.PIStateNotes.SV }}</span>
					<span v-else> - </span>
				</template>
			</el-table-column>
			<el-table-column label="不合格原因(機關)" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.PIState & 64">{{ row.PIStateNotes.Organ }}</span>
					<span v-else> - </span>
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
			:header-cell-style="{'background-color': '#F2F6FC'}"
			style="width: 100%"
		>
			<el-table-column label="序號" type="index" width="45" align="center" :index="indexMethod" />
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:width="['organAssign'].includes(key) ? 70 : ['CaseNo', 'DateCreate', 'DeviceType'].includes(key) ? 120 : null"
				:formatter="formatter"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="column.property == 'CaseNo'"> <el-link :href="`https://road.nco.taipei/RoadMis2/web/ViewDefectAllData.aspx?RDT_ID=${row[column.property]}`" target="_blank">{{ row[column.property] }}</el-link></span>
					<span v-else-if="column.property.includes('Img')">
						<el-popover popper-class="imgHover" placement="top" trigger="hover" :close-delay="0">
							<el-image style="width: 100%; height: 100%" :src="row[column.property]" fit="scale-down" />
							<el-image slot="reference" style="width: 100%; height: 100%" :src="row[column.property]" fit="scale-down" @click="showImg(row, column.property)"/>
						</el-popover>
					</span>
					<span v-else-if="checkPermission(['PIcase.editor']) && [ 'PCIValue' ].includes(column.property)">
						<span v-if="row.edit">
							<el-input-number 
								v-if="[ 'PCIValue' ].includes(column.property)" 
								class="edit-number"
								v-model.number="row[column.property]"
								controls-position="right"
								size="mini"
								:precision="1"
								:step="0.1"
								:min="0"
								:max="100"
								style="width: 80px"
							/>
							<el-button type="text" @click="rowActive = row; setResult();">
								<i class="el-icon-success" />
							</el-button>
							<el-button type="text" @click="row.edit = false; getList()">
								<i class="el-icon-error" />
							</el-button>
						</span>
						<span v-else>
							<span>{{ formatter(row, column) }}</span>
							<el-link @click="row.edit = true" style="margin-left: 5px">
								<i class="el-icon-edit" />
							</el-link>
						</span>
					</span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="監造抽查" width="160px" align="center">
				<template slot-scope="{ row }">
					<template v-if="checkPermission(['PIcase.inspector']) && !(row.PIState & 2) && !(row.PIState & 32)">
						<el-button-group>
							<el-button v-for="(name, type) in options.resultType.SV" :key="type" :type="type == 2 ? 'success' : 'danger'" size="mini" @click="beforeSetResult(row, Number(type))">{{ name }}</el-button>
						</el-button-group>
					</template>
					<template v-else>
						<span v-if="(row.PIState & 2) || (row.PIState & 32)">
							<i v-if="row.PIState & 2" class="el-icon-check" style="color: #67C23A; font-weight: bold;" />
							<i v-else-if="row.PIState & 32" class="el-icon-close" style="color: #F56C6C; font-weight: bold;" />
							<el-button v-if="checkPermission(['PIcase.inspector'])" class="btn-revoke" size="mini" plain round @click="beforeSetResult(row, -2)">撤銷</el-button>
						</span>
						<span v-else> - </span>
					</template>
				</template>
			</el-table-column>
			<el-table-column label="機關抽查" width="160px" align="center">
				<template slot-scope="{ row }">
					<template v-if="checkPermission(['PIcase.supervisor']) && !(row.PIState & 4) && !(row.PIState & 64)">
						<el-button-group>
							<el-button v-for="(name, type) in options.resultType.Organ" :key="type" :type="type == 4 ? 'success' : 'danger'" size="mini" @click="beforeSetResult(row, Number(type))">{{ name }}</el-button>
						</el-button-group>
					</template>
					<template v-else>
						<span v-if="(row.PIState & 4) || (row.PIState & 64)">
							<i v-if="row.PIState & 4" class="el-icon-check" style="color: #67C23A; font-weight: bold;" />
							<i v-else-if="row.PIState & 64" class="el-icon-close" style="color: #F56C6C; font-weight: bold;" />
							<el-button v-if="checkPermission(['PIcase.supervisor'])" class="btn-revoke" size="mini" plain round @click="beforeSetResult(row, -4)">撤銷</el-button>
						</span>
						<span v-else> - </span>
					</template>
				</template>
			</el-table-column>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />

		<!-- 抽查結果Dialog -->
		<el-dialog
			:visible.sync="showResultConfirm"
			width="300px"
			:show-close="false"
			:close-on-click-modal="false"
			:close-on-press-escape="false"
			center
		>	
			<span slot="title">確認提交 {{ rowActive.CaseNo }}的抽查結果？</span>
			<div>來源案號: {{ rowActive.CaseNo }}</div>
			<div v-if="rowActive.resultType < 0" style="color: #F56C6C" >撤銷抽查</div>
			<div v-else>抽查結果: 
				<span v-if="rowActive.PIState & 2 || rowActive.PIState & 4" style="color: #67C23A">合格</span>
				<span v-else-if="rowActive.PIState & 32 || rowActive.PIState & 64" style="color: #F56C6C">不合格</span>
			</div>
			<div v-if="rowActive.resultType > 0 && (rowActive.resultType & 32 || rowActive.resultType & 64)">原因: 
				<el-select v-model="rowActive.ReasonType">
					<el-option v-for="( name, key ) in options.reasonType" :key="key" :label="name" :value="Number(key)" />
				</el-select>
			</div>
			<span slot="footer" class="footer-btns">
				<el-button @click="showResultConfirm = false; getList();">取消</el-button>
				<el-button type="primary" :loading="loading" @click="setResult()">確定</el-button>
			</span>
		</el-dialog>

		<el-image-viewer
			v-if="showImgViewer"
			class="img-preview"
			:on-close="() => { showImgViewer = false; }"
			:url-list="imgUrls"
		/>
	</div>
</template>

<script>
import moment from "moment";
import { getTypeMap, getTenderRound } from "@/api/type";
import { getInsCaseList, setInsCaseList, getInsCaseCount } from "@/api/PI";
import checkPermission from '@/utils/permission';
import Pagination from "@/components/Pagination";
import ElImageViewer from 'element-ui/packages/image/src/image-viewer';

export default {
	name: "insCaseList",
	components: { Pagination, ElImageViewer },
	data() {
		return {
			loading: false,
			showResultConfirm: false,
			showImgViewer: false,
			listQuery: {
				tenderRound: 91,
				pageCurrent: 1,
				pageSize: 50
			},
			resultHeader: {
				CaseNo: {
					name: "案件編號",
					sortable: true
				}
			},
			headers: {
				CaseNo: {
					name: "案件編號",
					sortable: true
				},
				DateCreate: {
					name: "成案日期",
					sortable: false,
				},
				// ReportDate: {
				// 	name: "通報日期",
				// 	sortable: false,
				// },
				DeviceType: {
					name: "設施類型",
					sortable: true
				},
				// rDeviceType: {
				// 	name: "認列類型",
				// 	sortable: true
				// },
				// organAssign: {
				// 	name: "機關交辦",
				// 	sortable: false
				// },
				Place: {
					name: "地址",
					sortable: false
				},
				// CaseType: {
				// 	name: "損壞情況",
				// 	sortable: false
				// },
				DistressType: {
					name: "損壞態樣",
					sortable: false
				},
				DistressLevel: {
					name: "損壞程度",
					sortable: false
				},
				// BrokeStatus: {
				// 	name: "損壞狀況",
				// 	sortable: false
				// },
				ImgZoomOut: {
					name: "照片",
					sortable: false
				},
				PCIValue: {
					name: "PCI",
					sortable: false
				}
			},
			total: 0,
			checkNum: {
				SV: { 
					AC: { check: 0, fail: 0, total: 0 }, 
					facility: { check: 0, fail: 0, total: 0 } 
				}, 
				Organ: { 
					AC: { check: 0, fail: 0, total: 0 }, 
					facility: { check: 0, fail: 0, total: 0 } 
				} 
			},
			resultList: [],
			list: [],
			rowActive: {},
			options: {
				tenderRoundMap: {},
				DeviceType: {},
				DistressType: {},
				DistressLevel: {
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
					SV: {
						2: "合格",
						32: "不合格"
					},
					Organ: {
						4: "合格",
						64: "不合格"
					}
				},
				reasonType: {
					1: "損壞情形說明與現況不符(PI1.2)",
					2: "損壞程度與現況不符(PI2.2)"
				},
			}
		};
	},
	computed: {
		reasonTypeArr() {
			let reasonTypeArr = { 1: 0, 2: 0 };
			this.resultList.forEach(l => {
				for(let type of Object.keys(this.options.reasonType)) {
					if((l.PIState & 32) && l.PIStateNotes.SV == this.options.reasonType[type]) reasonTypeArr[type]++;
					if((l.PIState & 64) && l.PIStateNotes.Organ == this.options.reasonType[type]) reasonTypeArr[type]++;
				}
			})
			return reasonTypeArr
		},
		checkNum() {
			let checkNum = { 
				
			};

			const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];
			

			return checkNum;
		}
	},
	created() {
		getTypeMap().then(response => {
			this.options.DeviceType = response.data.DeviceTypeMap;
			this.options.DistressType = response.data.BTypeMap;
		})
		getTenderRound().then(response => {
			this.options.tenderRoundMap = response.data.list.reduce((acc, cur) => {
				if(cur.tenderId <= 1001) return acc;

				let roundId = `${cur.tenderId}${String(cur.round).padStart(3, '0')}`;
				if(cur.zipCodeSpec != 0) roundId += `${cur.zipCodeSpec}`;

				let name = `${cur.tenderName}`;
				if(cur.title.length != 0) name += `_${cur.title}`;

				acc[roundId] = { 
					id: cur.id,
					name, 
					tenderId: cur.tenderId, 
					isMain: cur.zipCodeSpec == 0,
					zipCode: cur.zipCodeSpec == 0 ? cur.zipCode : cur.zipCodeSpec, 
					roundStart: cur.roundStart, 
					roundEnd: cur.roundEnd
				};
				return acc;
			}, {});

			if(Object.keys(this.options.tenderRoundMap).length > 0) {
				if(!Object.keys(this.options.tenderRoundMap).includes(String(this.listQuery.tenderRound))) {
					this.listQuery.tenderRound = this.$route.query.surveyId = Number(Object.keys(this.options.tenderRoundMap)[0]);
				}
			}
			if(Object.keys(this.options.tenderRoundMap).length == 0) {
				this.options.tenderRoundMap = { "-1": { id: -1 }};
				this.listQuery.tenderRound = -1;
			}
		});
	},
	methods: {
		checkPermission,
		showImg(row, prop) {
			const otherProp = ['ImgZoomIn', 'ImgZoomOut'].filter(imgType => imgType != prop)[0];
			this.imgUrls = [ row[prop], row[otherProp] ];
			this.showImgViewer = true;
		},
		getList() {
			this.loading = true;
			this.list = [];
			this.resultList = [];
			this.checkNum = {
				SV: { 
					AC: { check: 0, fail: 0, total: 0 }, 
					facility: { check: 0, fail: 0, total: 0 } 
				}, 
				Organ: { 
					AC: { check: 0, fail: 0, total: 0 }, 
					facility: { check: 0, fail: 0, total: 0 } 
				} 
			};
			const tenderRound = this.options.tenderRoundMap[this.listQuery.tenderRound];

			getInsCaseList({
				surveyId: tenderRound.id,
				pageCurrent: this.listQuery.pageCurrent,
				pageSize: this.listQuery.pageSize
			}).then((response) => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.total = response.data.total;
					this.checkNum.SV.AC.total = Math.round(this.total * 0.15 * 0.6, 0);
					this.checkNum.SV.facility.total = Math.round(this.total * 0.15 * 0.4, 0);
					this.checkNum.Organ.AC.total = Math.round(this.total * 0.05 * 0.6, 0);
					this.checkNum.Organ.facility.total = Math.round(this.total * 0.05 * 0.4, 0);

					getInsCaseCount({
						surveyId: tenderRound.id,
					}).then(response => { 
						const result = response.data.result;
						for(const key in result) {
							const [ from, type, subtype ] = key.split("_");
							this.checkNum[from][type][subtype] = Number(result[key]);
						}
					});

					this.list = response.data.list;
					this.list.forEach(l => {
						l.PIStateNotes = JSON.parse(l.PIStateNotes);
						for(const key of ["Firm", "SV", "Organ"]) {
							if(!l.PIStateNotes.hasOwnProperty(key)) this.$set(l.PIStateNotes, key, "");
						}
						this.$set(l, "edit", false);
					});

					this.resultList = response.data.resultList;
					this.resultList.forEach(l => {
						l.PIStateNotes = JSON.parse(l.PIStateNotes);
					});
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		beforeSetResult(row, result) {
			this.rowActive = JSON.parse(JSON.stringify(row));

			if((result & 32) || (result & 64)) this.$set(this.rowActive, "ReasonType", 1);
			else this.$set(this.rowActive, "ReasonType", 0);

			this.$set(this.rowActive, "resultType", result);
			if(result == -2) {
				if(this.rowActive.PIState & 2) this.rowActive.PIState -= 2;
				if(this.rowActive.PIState & 32) this.rowActive.PIState -= 32;
			} else if(result == -4) {
				if(this.rowActive.PIState & 4) this.rowActive.PIState -= 4;
				if(this.rowActive.PIState & 64) this.rowActive.PIState -= 64;
			} else this.rowActive.PIState += result;

			this.showResultConfirm = true;
		},
		setResult() {
			this.loading = true;
			this.showResultConfirm = false;
			if(this.rowActive.PIState & 32) this.rowActive.PIStateNotes.SV = this.options.reasonType[this.rowActive.ReasonType];
			else this.rowActive.PIStateNotes.SV = "";
			if(this.rowActive.PIState & 64) this.rowActive.PIStateNotes.Organ = this.options.reasonType[this.rowActive.ReasonType];
			else this.rowActive.PIStateNotes.Organ = "";

			setInsCaseList( this.rowActive.SerialNo, {
				PCIValue: this.rowActive.PCIValue,
				PIState: this.rowActive.PIState,
				PIStateNotes: JSON.stringify(this.rowActive.PIStateNotes)
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
		indexMethod(index) {
			return (index + 1 + (this.listQuery.pageCurrent - 1) * this.listQuery.pageSize);
		},
		formatter(row, column) {
			if([ 'organAssign' ].includes(column.property)) return row[column.property] == 1 ? '是' : '-';
			else if(['DeviceType', 'rDeviceType'].includes(column.property)) return this.options.DeviceType[row[column.property]];
			else if(column.property == 'DistressType') return this.options.DistressType[row[column.property]];
			else if(column.property == 'DistressLevel') return this.options.DistressLevel[row[column.property]];
			// else if(column.property == 'BrokeStatus') return this.options.BrokeStatus[row.DistressLevel];
			else if(column.property.indexOf('Date') != -1) return row[column.property] ? this.formatTime(row[column.property]) : "-";
			else if(column.property.indexOf('Area') != -1) return Number(row[column.property]) ? row[column.property].toLocaleString() : "-";
			else return row[column.property] && row[column.property] != '0' ? row[column.property] : "-";
		},
		formatTime(time) {
			return moment(time).format("YYYY/MM/DD");
		},
		handleDownload() {
			this.loading = true;
			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");

			getInsCaseList({
				tenderId: this.listQuery.zipCode,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD"),
				pageCurrent: 1,
				pageSize: this.total
			}).then(response => {
				const list = response.data.list;

				const tHeader = Object.values(this.headers).map(value => value.name).concat(["監造抽查", "機關抽查", "備註"]);
				const filterVal = Object.keys(this.headers).concat(["SVCheck", "OrganCheck", "Note"]);
				// tHeader = [ "日期", "星期", "DAU", "新增帳號數", "PCU", "ACU", "儲值金額", "DAU帳號付費數", "DAU付費率", "DAU ARPPU", "DAU ARPU", "新增帳號儲值金額", "新增帳號付費數", "新增付費率", "新增帳號ARPPU", "新增帳號ARPU" ];
				// filterVal = [ "date", "weekdayText", "dau", "newUser", "pcu", "acu", "amount", "dauPaid", "dauPaidRatio", "dauARPPU", "dauARPU", "newUserAmount", "newUserPaid", "newUserPaidRatio", "newUserARPPU", "newUserARPU" ];
				const dataList = list.map(l => {
					l.DateCreate = this.formatTime(l.DateCreate);
					l.DeviceType = this.options.DeviceType[l.DeviceType];
					l.organAssign =  l.organAssign == 1 ? "是" : "";
					l.DistressType = this.options.DistressType[l.DistressType];
					l.DistressLevel = this.options.DistressLevel[l.DistressLevel];
					// l.BrokeStatus = this.options.BrokeStatus[l.DistressLevel];
					l.PCIValue = l.PCIValue == 0 ? "" : l.PCIValue;

					l.SVCheck = (l.PIState & 2) ? "V" : (l.PIState & 32) ? "X" : "";
					l.OrganCheck = (l.PIState & 4) ? "V" : (l.PIState & 64) ? "X" : "";

					l.Note = (l.PIState & 32) ? l.PIStateNotes.SV : (l.PIState & 64) ? l.PIStateNotes.Organ : "";
					return l
				}) 
				const data = this.formatJson(filterVal, dataList);

				import("@/vendor/Export2Excel").then((excel) => {
					excel.export_json_to_excel({
						header: tHeader,
						data,
					});
					this.loading = false;
				});
			})
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
.imgHover
	max-width: 400px
.inspected-case-list
	height: calc(100vh - 50px)
	overflow: scroll
	.filter-container 
		.el-select.tender-select
			width: 400px
			.el-input__inner
					padding-left: 10px
					text-align: left
		.el-input__inner
			padding-left: 5px
			text-align: center
		.filter-item
			margin-right: 5px
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
					.fail-num
						color: #F56C6C
						// font-size: 20px
						vertical-align: text-top
	.icon-tooltip
		font-size: 16px
		color: #606266
		margin-left: 3px
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
	.el-table
		.el-table__row:hover > td
			background: inherit
		.el-button--danger
			padding: 7px 9px
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
	.img-preview
		width: 100%
		.el-image-viewer__mask
			opacity: 0.7
		.el-icon-circle-close
			color:  #FFF
</style>