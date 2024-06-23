<template>
	<div class="app-container inspection-progress" v-loading="loading">
		<h2>1999</h2>
		<!-- 搜尋 -->
		<div class="filter-container">
			<el-select v-model="listQuery.ContractId" placeholder="請選擇" style="width: 110px;">
        <el-option label="全部" :value="99" />
          <el-option v-for="(text, id) in team" :key="`ContractId${id}`" :label="text" :value="Number(id)" />
        </el-select>
				<el-date-picker
					style="margin-left: 10px;"
					v-model="listQuery.dateRange"
					type="daterange"
					range-separator="至"
					start-placeholder="開始日期"
					end-placeholder="結束日期">
				</el-date-picker>

			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()" style="margin-left: 10px;">搜尋</el-button>
			<el-button class="filter-item" type="success" @click="openCsvDialog()">匯入csv</el-button>
		</div>

		

		<!-- 資料列表 -->
		<el-table ref="multipleTable" empty-text="目前沒有資料" :data="list" border fit :header-cell-style="{ 'background-color': '#F2F6FC' }" style="width: 100%">
			<el-table-column 
				v-for="(value, key) in headers" 
				:key="key" :prop="key" 
				:label="value.name" 
				align="center" 
				:sortable="value.sortable"
				:width="value.width"
			>
			</el-table-column>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />

    <el-dialog
			:visible.sync="csvVisible"
			width="600px">
			<el-form ref="file" label-width="120px">
			<el-form-item label="導入csv">
				<el-upload
					class="upload-demo"
					ref="upload"
					drag
					accept=".csv"
					action=""
					:multiple="false"
					:limit="1"
					:auto-upload="false"
					:on-change="handleChange">
					<i class="el-icon-upload"></i>
					<div class="el-upload__text">將文件拖到此處，或<em>點擊上傳csv</em></div>
				</el-upload>
			</el-form-item>
			</el-form>
			<span slot="footer" class="dialog-footer">
				<el-button type="primary" @click="importCsv">匯入</el-button>
				<el-button @click="closeCsvDialog()">取消</el-button>
			</span>
    </el-dialog>
			
		<!-- csv匯入成功與失敗顯示 -->
		<el-dialog
			title="匯入結果"
			:visible.sync="csvResultVisible"
			width="500px">
			<h3 align="center">匯入成功</h3>
			<el-table :data="successMapIndex" style="width: 100%;" align="center" :row-class-name="successColor">
				<el-table-column label="案件編號" :formatter="successFormatter" align="center"/>
			</el-table>

			<h3 align="center">匯入失敗(重複)</h3>
			<el-table :data="failMapIndex" style="width: 100%;" align="center" :row-class-name="failColor">
				<el-table-column label="案件編號" :formatter="failFormatter" align="center" />
			</el-table>

			<span slot="footer" class="dialog-footer">
				<el-button @click="csvResultVisible = false">確定</el-button>
			</span>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getCaseListLog, importCaseListLog, getAllCaseListLog } from "@/api/car";
import TimePicker from '@/components/TimePicker';
import Pagination from "@/components/Pagination";
import commonMixin from '@/mixins/common';
import { parse } from 'csv-parse';
import { Trans97 } from 'trans97';

export default {
	mixins: [commonMixin],
	name: "caseListLog",
	components: { TimePicker, Pagination },
	data() {
	return {
		loading: false,
		dialogMapVisible: true,
		csvVisible: false,
		csvResultVisible: false,
		file: null,
		timeTabId: 1,
		total: 0,
		successMap: [],
		failMap: [],
		// dateRange: [ moment().startOf("week").add(1, 'day').toDate(), moment().endOf("week").add(1, 'day').toDate() ],
		listQuery: {
			filterType: 1,
			dateRange: [],
      ContractId: 1,
			pageCurrent: 1,
			pageSize: 50
		},
		area:{
			0: "全部",
			100: '中正區',
			103: '大同區',
			104: '中山區',
			105: '松山區',
			106: '大安區',
			108: '萬華區',
			110: '信義區',
			111: '士林區',
			112: '北投區',
			114: '內湖區',
			115: '南港區',
			116: '文山區',
			999: '橋涵區'
		},
    team: {
      1: '第一分隊',
      2: '第二分隊',
      3: '第三分隊',
      4: '第四分隊',
      5: '第五分隊',
      6: '第六分隊'
    },
		list:[],
		rowActive: {},
		headers: {
			CaseNo: {
        name: '案件編號',
        sortable: false,
				width: 120
      },
      DateReport: {
        name: '查報日期',
        sortable: false,
				width: 100
      },
      ContractId: {
        name: '標案ID',
        sortable: false,
				width: 100
      },
      ZipCode: {
        name: '區號',
        sortable: false,
				width: 90
      },
      ReportUser: {
        name: '登錄人員',
        sortable: false,
				width: 120
      },
      ReceiveUser: {
        name: '收件人員',
        sortable: false,
				width: 130
      },
      LocationReport: {
        name: '查報地點',
        sortable: false
      },
      DamageDesc: {
        name: '損壞情形',
        sortable: false,
				width: 140
      },
      DamageCondition: {
        name: '損壞狀況',
        sortable: false,
				width: 100
      },
      TemporaryFix: {
        name: '臨時修補',
        sortable: false,
				width: 90
      },
      CaseCondition: {
        name: '案件狀態',
        sortable: false,
				width: 90
      },

		},
		dialogVisible: false,
		InputNotes:'',
		options: {
			tenderRoundMap: {},
			districtMap: {},
			districtOrder: [],
		}
	};
	},
	computed: {
		successMapIndex() {
			return this.successMap.map((item, index) => ({ index, value: item }));
		},
		failMapIndex() {
			return this.failMap.map((item, index) => ({ index, value: item }));
		}
	},
	watch: {},
	created() {},
	mounted() {},
	methods: {
		formatTime(time) {
			return time ? moment(time).format("YYYY/MM/DD") : "";
		},
		successFormatter(row) {
			return row.value;
		},
		failFormatter(row) {
			return row.value;
		},
		successColor() {
			return 'success-row';
		},
		failColor() {
			return 'warning-row';
		},
		getList() {
			this.loading = true;

			const [ timeStart, timeEnd ] = this.listQuery.dateRange;
			const formattedTimeStart = this.formatTime(timeStart) || '';
			const formattedTimeEnd = this.formatTime(timeEnd) || '';

			if (this.listQuery.ContractId == 99) {
				// 顯示全部 有6個分隊(6個標)
				getAllCaseListLog({ 
					timeStart: formattedTimeStart,
					timeEnd: formattedTimeEnd,
					pageCurrent: this.listQuery.pageCurrent,
					pageSize: this.listQuery.pageSize,
				}).then(response => {
					this.total = response.data.total;
					this.list = response.data.list;
					response.data.list.map(item => {
						item.DateReport = this.formatTime(item.DateReport),
						item.EstimatedDate = this.formatTime(item.EstimatedDate),
						item.TemporaryFix = 0 ? '是' : '否', // 邏輯是反的 需實驗
						item.ZipCode = this.area[item.ZipCode],
						item.ContractId = this.team[item.ContractId]
					});

					this.loading = false;
				}).catch(err => { this.loading = false });
			} else {
				// 只顯示其中一個分隊
				getCaseListLog({ 
					ContractId: this.listQuery.ContractId,
					timeStart: formattedTimeStart,
					timeEnd: formattedTimeEnd,
					pageCurrent: this.listQuery.pageCurrent,
					pageSize: this.listQuery.pageSize  
				}).then(response => {
					if (response.data.list.length == 0) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
						this.loading = false;
					} else {
						this.total = response.data.total;
						this.list = response.data.list;
						this.list.map(item => {
							item.DateReport = this.formatTime(item.DateReport),
							item.EstimatedDate = this.formatTime(item.EstimatedDate),
							item.TemporaryFix = 0 ? '是' : '否', // 邏輯是反的 需實驗
							item.ZipCode = this.area[item.ZipCode],
							item.ContractId = this.team[item.ContractId]
						});
						this.loading = false;
					}
				}).catch(err => { this.loading = false; });
			}
		},
		openCsvDialog() {
			this.csvVisible = true;
		},
		closeCsvDialog() {
			this.csvVisible = false;
			this.$refs.upload.clearFiles();
		},
    handleChange(file) {
			this.file = file.raw;
		},
		async importCsv() {
			const reader = new FileReader();
			reader.onload = (event) => {
				const csvData = event.target.result;
				parse(csvData, {
					columns: true,
					trim: true
				}, (err, res) => {
					if (err) {
						console.error(err);
					} else {
						const caseNo = res.map((key) => key.案件編號);
						const dateReport = res.map((key) => key.查報日期);
						const zipAndTeam = res.map((key) => key.權責單位); // 分成zipCode區號 ContractId標案ID
						const reportUser = res.map((key) => key.登錄人員);
						const receiveUser = res.map((key) => key.收件人員);
						const locationReport = res.map((key) => key.查報地點);
						const estimatedDate = res.map((key) => key.預計完工日期);
						const sourceNo = res.map((key) => key.來源編號);
						const damageDesc = res.map((key) => key.損壞情形);
						const damageCondition = res.map((key) => key.損壞狀況);
						const areaFix = res.map((key) => key.修補面積);
						const temporaryFix = res.map((key) => key.臨時修復);
						const sourceReport = res.map((key) => key.查報來源);
						const caseCondition = res.map((key) => key.案件狀態);
						const twd97_x = res.map((key) => key["X座標(TWD97)"]);
						const twd97_y = res.map((key) => key["Y座標(TWD97)"]);

						const formatDateReport = []; // 查報日期
						const formatEstimatedDate = []; // 預計完工日期

						for (let i = 0; i < caseNo.length; i++) {
							formatDateReport.push(moment(dateReport[i]).add(1911, 'years').subtract(8, 'hours').format('YYYY-MM-DD HH:mm:ss'));
							formatEstimatedDate.push(moment(estimatedDate[i]).add(1911, 'years').subtract(8, 'hours').format('YYYY-MM-DD HH:mm:ss'));
						}
						// 權責單位 區域轉數字
						const zipCode = zipAndTeam.map(item => {
							for (const [code, name] of Object.entries(this.area)) {
								if (item.includes(name)) return code;
							}
						});
						// 權責單位 分隊轉數字
						const contractId = zipAndTeam.map(item => {
							for (const [code, name] of Object.entries(this.team)) {
								if (item.includes(name)) return code;
							}
						})

						const trans97 = new Trans97({
							type: 'wgs84'
						});
						
						const positionArr = [];
						for (let i = 0; i < twd97_x.length; i++) {
							const position = trans97.getLocation(parseFloat(twd97_x[i]), parseFloat(twd97_y[i]));
							positionArr.push(position);
						}
						
						const temporaryFixArr = [];

						// 初始化匯入成功與失敗資料
						this.successMap = [];
						this.failMap = [];
						for (let i = 0; i < caseNo.length; i++) {
							
							if (temporaryFix[i] == '是') temporaryFixArr.push(1);
							else temporaryFixArr.push(0);

							importCaseListLog({
								CaseNo: caseNo[i],
								DateReport: formatDateReport[i],
								ContractId: contractId[i],
								ZipCode: zipCode[i],
								ReportUser: reportUser[i],
								ReceiveUser: receiveUser[i],
								LocationReport: locationReport[i],
								EstimatedDate: formatEstimatedDate[i],
								SourceNo: sourceNo[i],
								DamageDesc: damageDesc[i],
								DamageCondition: damageCondition[i],
								AreaFix: areaFix[i],
								TemporaryFix: temporaryFixArr[i],
								SourceReport: sourceReport[i],
								CaseCondition: caseCondition[i],
								WGS84_x: positionArr[i].lat,
								WGS84_y: positionArr[i].lng
							}).then(response => {

								// 匯入失敗的案件編號(重複)
								if (response.data.list && response.data.list[0] != undefined) {
									this.failMap.push(response.data.list[0].CaseNo);
									// console.log('fail', this.failMap);
								}
								
								// 匯入成功的案件編號
								if (response.data.importSuccess && response.data.importSuccess[0] != undefined) {
									this.successMap.push(response.data.importSuccess[0]);
									// console.log('success', this.successMap);
								}
								this.csvResultVisible = true;
							}).catch(err => console.log(err));
						}
						this.csvVisible = false;
						this.$refs.upload.clearFiles();
					}
				});
			};
			reader.readAsText(this.file);
		}
	}
};
</script>

<style lang="sass">
.inspection-progress
	.el-table
		.success-row
			background: #f0f9eb
		.warning-row
			background: oldlace
	.dialog-footer
		display: flex
		justify-content: center
	.filter-container
		.filter-item
			margin-right: 5px
			.el-select
				width: 80px
				.el-input__inner
					padding-left: 8px
					padding-right: 10px
				.el-input__suffix
					right: 0
					margin-right: -3px
					transform: scale(0.7)
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
			.el-select.tender-select
				width: 240px
				.el-input__inner
					padding-left: 8px
					padding-right: 10px
					text-align: left
				.el-input__suffix
					right: 0
					margin-right: -3px
					transform: scale(0.7)
</style>
