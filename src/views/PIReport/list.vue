<template>
	<div class="app-container perfReport-List" v-loading.fullscreen="loading" :element-loading-text="genPDF ? `PDF生成中 (${genPercent}%) ...` : ''">
		<h2>{{ options.reportTypeMap[listQuery.reportType].name }} - 列表</h2>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(options.districtList).length <= 1">
				<el-option v-for="(info, zip) in options.districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<span class="filter-item">
				<div style="font-size: 12px; color: #909399">報告日期</div>
				<time-picker class="filter-item" shortcutType="day" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" :disabledDate="false" @search="getList"/>
			</span>

			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>
			<el-button @click="showNewPdf = true" type="success" icon="el-icon-plus">新增</el-button>
		</div>

		<div class="filter-container">
			<el-table 
			:data="list"
			empty-text="目前沒有資料"
			border
			fit
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			style="width: 100%"
			>
				<el-table-column type="index" label="序號" width="60" align="center" />
				<el-table-column prop="reportDate" label="報告日期" align="center">
					<template slot-scope="{ row, column }"> {{ formatDate(row[column.property]) }}</template>
				</el-table-column>
				<el-table-column prop="dutyWithName" label="編輯人員" align="center" />
				<el-table-column prop="pageCountTotal" label="頁數" align="center" />
				<el-table-column label="進度" align="center">
					<template slot-scope="{ row }">
						<span :style="row.contentFin == row.contentTotal ? 'color: #67C23A' : 'color: #F56C6C'">{{ row.contentFin }}</span><span> / {{ row.contentTotal }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="dateComplete_At" label="完成日期" align="center">
					<template slot-scope="{ row, column }"> {{ formatDate(row[column.property]) }}</template>
				</el-table-column>
				<el-table-column label="動作" align="center">
					<template slot-scope="{ row }">
						<el-button-group>
							<el-button type="success" plain size="mini" @click="beforeEdit(row)"><i class="el-icon-edit"></i>編輯</el-button>
							<el-button type="info" plain size="mini" :disabled="row.contentFin != row.contentTotal" @click="previewPdf(row)" ><i class="el-icon-download"></i>
								<span v-if="listQuery.reportType == 2">下載</span>
								<span v-else>預覽</span>
							</el-button>
						</el-button-group>
					</template>
				</el-table-column>
			</el-table>
		</div>

		<!-- Dialog: 新增 -->
		<el-dialog width="400px" title="新增" :visible.sync="showNewPdf">
			<div>
				<el-form :model="addList" label-width="80px">
					<el-form-item label="行政區">
						<el-select class="filter-item" v-model="addList.zipCode" :disabled="Object.keys(options.districtList).length <= 1" style="width: 250px;margin-bottom:15px">
							<el-option v-for="(info, zip) in options.districtList" :key="zip" :label="info.name" :value="Number(zip)" />
						</el-select>
					</el-form-item>
					<el-form-item label="報告日期">
						<el-date-picker
							v-model="addList.reportDate"
							type="date"
							placeholder="日期"
							:picker-options="pickerOptions"
							:clearable="false"
							style="width: 250px"
						/>
					</el-form-item>
					<el-form-item label="檢查日期">
						<el-date-picker
							v-model="addList.checkDate"
							type="date"
							placeholder="日期"
							:picker-options="pickerOptions"
							:clearable="false"
							style="width: 250px"
						/>
					</el-form-item>
				</el-form>
				
			</div>
			<div slot="footer" class="dialog-footer">
				<el-button @click="showNewPdf = false">取消</el-button>
				<el-button type="primary" @click="addNewPdf()">確定</el-button>
			</div>
		</el-dialog>

		<!-- Dialog: PDF預覽 -->
		<el-dialog class="pdf-preview" width="800px" :visible.sync="showPdfDialog">
			<div ref="pdfViewer" />
			<div slot="footer" class="dialog-footer">
				<el-button size="small" @click="showPdfDialog = false">取消</el-button>
				<el-button type="primary" size="small" @click="handleDownload()">下載</el-button>
			</div>
		</el-dialog>

		<!-- 日報表 -->
		<span v-if="listQuery.reportType == 1">
			<PI21 v-show="false" ref="PI21" />
			<PI21Att1 v-show="false" ref="PI21Att1" />
			<PI21Att2 v-show="false" ref="PI21Att2" />
			<PI31 v-show="false" ref="PI31" />
			<PI31Att1 v-show="false" ref="PI31Att1" />
		</span>

		<!-- 週報表 -->
		<span v-if="listQuery.reportType == 2">
			<PI22 v-show="false" ref="PI22" />
			<PI22Att1 v-show="false" ref="PI22Att1" />
			<PI22Att2 v-show="false" ref="PI22Att2" />
			<PI22Att3 v-show="false" ref="PI22Att3" />
			<PI32 v-show="false" ref="PI32" />
			<PI32Att1 v-show="false" ref="PI32Att1" />
			<PI32Att2 v-show="false" ref="PI32Att2" />
			<PI41 v-show="false" ref="PI41" />
			<PI41Att1 v-show="false" ref="PI41Att1" />
		</span>
	</div>
</template>

<script>
import moment from "moment";
import { PDFDocument } from 'pdf-lib';
import { generate } from '@pdfme/generator';
import { Viewer, BLANK_PDF } from '@pdfme/ui';
import { getPerfReport, addPerfReport, getPerfReportList } from "@/api/PI";
import TimePicker from '@/components/TimePicker';
// 日報表
import PI21 from '@/views/PIReport/daily/PI2_1.vue';
import PI21Att1 from '@/views/PIReport/daily/PI2_1_Att_1.vue';
import PI21Att2 from '@/views/PIReport/daily/PI2_1_Att_2.vue';
import PI31 from '@/views/PIReport/daily/PI3_1.vue';
import PI31Att1 from '@/views/PIReport/daily/PI3_1_Att_1.vue';
// 週報表
import PI22 from '@/views/PIReport/weekly/PI2_2.vue';
import PI22Att1 from '@/views/PIReport/weekly/PI2_2_Att_1.vue';
import PI22Att2 from '@/views/PIReport/weekly/PI2_2_Att_2.vue';
import PI22Att3 from '@/views/PIReport/weekly/PI2_2_Att_3.vue';
import PI32 from '@/views/PIReport/weekly/PI3_2.vue';
import PI32Att1 from '@/views/PIReport/weekly/PI3_2_Att_1.vue';
import PI32Att2 from '@/views/PIReport/weekly/PI3_2_Att_2.vue';
import PI41 from '@/views/PIReport/weekly/PI4_1.vue';
import PI41Att1 from '@/views/PIReport/weekly/PI4_1_Att_1.vue';

export default {
	name: "perfReportList",
	components:{ 
		TimePicker, 
		PI21, PI21Att1, PI21Att2, PI31, PI31Att1, 
		PI22, PI22Att1, PI22Att2 , PI22Att3, PI32, PI32Att1, PI32Att2, PI41, PI41Att1
	},
	data() {
		return {
			loading: false,
			genPDF: false,
			genPercent: 0,
			showNewPdf:false,
			timeTabId: 4,
			dateRange: [ moment().startOf("month").toDate(), moment().endOf("month").toDate() ],
			showPdfDialog: true,
			pickerOptions: {
				firstDayOfWeek: 1,
				shortcuts: [
					{
						text: "今日",
						onClick(picker) {
							const date = moment();
							picker.$emit("pick", date);
						},
					},
					{
						text: "昨日",
						onClick(picker) {
							const date = moment().subtract(1, "d");
							picker.$emit("pick", date);
						}
					},
					{
						text: "前日",
						onClick(picker) {
							const date = moment().subtract(2, "d");
							picker.$emit("pick", date);
						}
					}
				],
			},
			addList:{
				zipCode: 104,
				reportDate: moment().startOf("d").subtract(1, "d"),
				checkDate: moment().startOf("d").subtract(1, "d"),
			},
			listQuery:{
				reportType: 1,
				zipCode: 104
			},
			template:{},
			rowActive: {},
			list:[],
			listContent:[],
			perfPagesObj: {},
			options: {
				districtList: {
					// 100: {
					// 	"name": "中正區"
					// },
					103: {
						"name": "大同區"
					},
					104: {
						"name": "中山區"
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
				reportTypeMap: {
					1: {
						name: "日報表",
						path: "daily"
					},
					2: {
						name: "週報表",
						path: "weekly" 
					},
					3: {
						name: "月報表",
						path: "monthly"
					}
				}
			}
		};
	},
	computed: { },
	watch: { },
	created() {
		this.listQuery.reportType = this.$route.meta.reportType;

		if(this.$route.query.zipCode && this.$route.query.timeStart && this.$route.query.timeEnd) {
			this.listQuery.zipCode = Number(this.$route.query.zipCode);
			this.dateRange = [ this.$route.query.timeStart, this.$route.query.timeEnd ];
			this.timeTabId = -1;
		}
		
		this.getList();
	},
	async mounted() { 
		this.showPdfDialog = false;
		const font = {
			edukai: {
				data: await fetch('/assets/font/edukai-4.0.ttf').then(res => res.arrayBuffer()),
				fallback: true
			},
		};
		this.template = { "schemas": [], "basePdf": BLANK_PDF };
		this.viewer = new Viewer({ domContainer: this.$refs.pdfViewer, template: this.template, inputs: [{}], options: { font } });
	},
	methods: {
		getList() {
			this.loading = true;
			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;
			this.list = [];

			getPerfReport({
				zipCode: this.listQuery.zipCode,
				reportType: this.listQuery.reportType,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD")
			}).then((response) => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.list = response.data.list;
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		addNewPdf(){
			let perfItems = [];
			if(this.listQuery.reportType == 1) {
				perfItems = [
					{
						"perfItem": 201,
						"perfAtt": [0, 1, 2],
						"perfPages": []
					},
					{
						"perfItem": 301,
						"perfAtt": [0, 1],
						"perfPages": []
					}
				]
			}
			if(this.listQuery.reportType == 2) {
				perfItems = [
					{
						"perfItem": 202,
						"perfAtt": [0, 1, 2, 3],
						"perfPages": []
					},
					{
						"perfItem": 302,
						"perfAtt": [0, 1, 2],
						"perfPages": []
					},
					{
						"perfItem": 401,
						"perfAtt": [0, 1],
						"perfPages": []
					}
				]
			}

			addPerfReport({
				zipCode: this.addList.zipCode,
				reportType: this.listQuery.reportType,
				reportDate: moment(this.addList.reportDate).format('YYYY-MM-DD'), //報告日期
				checkDate: moment(this.addList.checkDate).format('YYYY-MM-DD'), //檢查報期
				perfItems
			}).then((response) => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "新增成功",
						type: "success",
					});
				}
				this.dateRange = [ moment(this.addList.reportDate).toDate(), moment(this.addList.reportDate).add(1, 'd').toDate() ],
				this.getList();
				this.loading = false;
			}).catch(error => { 
				let messageText = error.response.data.message;
				if (messageText) {
					switch (messageText) {
						case "Duplicate!":
							messageText = "重複";
							break;
					}
					this.$message({
						message: messageText,
						type: "error",
					});
				}
				this.loading = false; 
			});
			this.showNewPdf = false;
			this.getList();
		},
		beforeEdit(row){
			// console.log(row);
			const path = this.options.reportTypeMap[this.listQuery.reportType].path;
			this.$router.push({
				path: `/PIReport/${path}/edit`,
				query: { reportId: row.id }
			})
		},
		async previewPdf(row) {
			this.loading = true;
			this.genPDF = true;
			this.rowActive = row;
			this.perfPagesObj = {};
			this.genPercentArr = this.listQuery.reportType == 1 ? [ 0, 95, 95, 95, 97, 100 ] : this.listQuery.reportType == 2 ? [ 0, 30, 90, 95, 97, 100 ] : [ 0, 40, 90, 95, 97, 100 ];
			this.genPercentIndex = 1;
			this.genPercent = this.genPercentArr[this.genPercentIndex-1];
			const intervalSec = this.listQuery.reportType == 1 ? 1 : 12 * row.pageCountTotal;
			this.timer = setInterval(() => { 
				if(this.genPercentIndex-1 > 0 && this.genPercent < this.genPercentArr[this.genPercentIndex-1]) this.genPercent += Math.floor(Math.floor(Math.random() * (this.genPercentArr[this.genPercentIndex-1] - this.genPercent) * 0.5));
				if(this.genPercent < this.genPercentArr[this.genPercentIndex]) this.genPercent++;
				else if(this.genPercent >= 90 && this.genPercent < 99 && Math.floor(Math.random() * 2)) this.genPercent++;
			}, intervalSec);
			
			await getPerfReportList({
				reportId: row.id
			}).then(async (response) => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.listContent = response.data.list;
					this.listContent.sort((a,b) => a.perfItem - b.perfItem || a.perfAtt - b.perfAtt || a.perfPages - b.perfPages);

					if(this.listQuery.reportType == 1) {
						// 計算頁數
						const initPageArr = this.listContent
							.map(l => (
								l.perfItem == 201 && l.perfAtt == 1 ? 0 : l.pageCount
							)).map((pageCount, index, array) => array.slice(0, index+1).reduce((acc, cur) => acc+cur) - pageCount + 1);
						// console.log(initPageArr);

						initPageArr.forEach((initPage, index) => this.listContent[index].initPage = initPage);

						// 匯入個別報表
						for(const caseSpec of this.listContent) {
							if(caseSpec.perfItem == 201 && caseSpec.perfAtt == 0) await this.$refs.PI21.setData(caseSpec.id, caseSpec.initPage);
							if(caseSpec.perfItem == 201 && caseSpec.perfAtt == 1) await this.$refs.PI21Att1.setData(caseSpec.id, caseSpec.initPage);
							if(caseSpec.perfItem == 201 && caseSpec.perfAtt == 2) await this.$refs.PI21Att2.setData(caseSpec.id, caseSpec.initPage);
							if(caseSpec.perfItem == 301 && caseSpec.perfAtt == 0) await this.$refs.PI31.setData(caseSpec.id, caseSpec.initPage);
							if(caseSpec.perfItem == 301 && caseSpec.perfAtt == 1) await this.$refs.PI31Att1.setData(caseSpec.id, caseSpec.initPage);
						}
						this.genPercentIndex = 2;

						await this.fetchPdf_daily();
					} else if(this.listQuery.reportType == 2) {
						// 計算頁數
						const PI32Count = this.listContent.filter(l => (l.perfItem == 302 && l.perfAtt == 2)).length;
						const initPageArr = this.listContent
							.map(l => (
								(l.perfItem == 202 && l.perfAtt == 1) 
								? 0 : ((l.perfItem == 202 && [2, 3].includes(l.perfAtt)) || (l.perfItem == 302 && [1, 2].includes(l.perfAtt)))
								? 1 + ((l.perfItem == 302 && l.perfAtt == 2 && l.perfPages == PI32Count) ? 1 : 0) : l.pageCount
							)).map((pageCount, index, array) => array.slice(0, index+1).reduce((acc, cur) => acc+cur) - pageCount + 1);
						// console.log(initPageArr);

						initPageArr.forEach((initPage, index) => this.listContent[index].initPage = initPage);

						// 匯入個別報表
						for(const caseSpec of this.listContent) {
							if(caseSpec.perfItem == 202 && caseSpec.perfAtt == 0) await this.$refs.PI22.setData(caseSpec.id, caseSpec.initPage);
							if(caseSpec.perfItem == 202 && caseSpec.perfAtt == 1) await this.$refs.PI22Att1.setData(caseSpec.id, caseSpec.initPage);
							if(caseSpec.perfItem == 202 && caseSpec.perfAtt == 2) await this.$refs.PI22Att2.setData(caseSpec.id, caseSpec.initPage);
							if(caseSpec.perfItem == 202 && caseSpec.perfAtt == 3) await this.$refs.PI22Att3.setData(caseSpec.id, caseSpec.initPage);
							if(caseSpec.perfItem == 302 && caseSpec.perfAtt == 0) await this.$refs.PI32.setData(caseSpec.id, caseSpec.initPage);
							if(caseSpec.perfItem == 302 && caseSpec.perfAtt == 1) await this.$refs.PI32Att1.setData(caseSpec.id, caseSpec.initPage);
							if(caseSpec.perfItem == 302 && caseSpec.perfAtt == 2) {
								if(caseSpec.perfPages == 1) await this.$refs.PI32Att2.setData(caseSpec.id, true, caseSpec.initPage, caseSpec.perfPages);
								else {
									if(this.perfPagesObj[caseSpec.perfItem] == undefined || this.perfPagesObj[caseSpec.perfItem][caseSpec.perfAtt] == undefined) {
										this.perfPagesObj[caseSpec.perfItem] = {};
										this.perfPagesObj[caseSpec.perfItem][caseSpec.perfAtt] = [];
									}
									this.perfPagesObj[caseSpec.perfItem][caseSpec.perfAtt].push({ id: caseSpec.id, initPage: caseSpec.initPage, perfPages: caseSpec.perfPages });
								}
							}
							if(caseSpec.perfItem == 401 && caseSpec.perfAtt == 0) await this.$refs.PI41.setData(caseSpec.id, caseSpec.initPage);
							if(caseSpec.perfItem == 401 && caseSpec.perfAtt == 1) await this.$refs.PI41Att1.setData(caseSpec.id, caseSpec.initPage);
						}
						this.genPercentIndex = 2;

						await this.fetchPdf_weekly();
					}
				}
			}).catch(err => { this.loading = false; });
		},
		async fetchPdf_daily() {
			this.template = { "schemas": [], "basePdf": "" };
			const add_pdfUint8_21 = await this.$refs.PI21.getPDF();
			const add_pdfUint8_21Att1 = await this.$refs.PI21Att1.getPDF();
			const add_arrayBuffer_21Att2 = await this.$refs.PI21Att2.getPDF();
			const add_pdfUint8_31 = await this.$refs.PI31.getPDF();
			const add_pdfUint8_31Att1 = await this.$refs.PI31Att1.getPDF(); 
			this.genPercentIndex = 3;

			const add_pdf_21 = await PDFDocument.load(add_pdfUint8_21.buffer);
			const add_pdf_21Att1 = await PDFDocument.load(add_pdfUint8_21Att1.buffer);
			const add_pdf_21Att2 = await PDFDocument.load(add_arrayBuffer_21Att2);
			const add_pdf_31 = await PDFDocument.load(add_pdfUint8_31.buffer);
			const add_pdf_31Att1 = await PDFDocument.load(add_pdfUint8_31Att1.buffer);
			this.genPercentIndex = 4;

			const mergedPdf = await PDFDocument.create();
			const add_copiedPage_21 = await mergedPdf.copyPages(add_pdf_21, add_pdf_21.getPageIndices());
			const add_copiedPage_21Att1 = await mergedPdf.copyPages(add_pdf_21Att1, add_pdf_21Att1.getPageIndices());
			const add_copiedPage_21Att2 = await mergedPdf.copyPages(add_pdf_21Att2, add_pdf_21Att2.getPageIndices());
			const add_copiedPage_31 = await mergedPdf.copyPages(add_pdf_31, add_pdf_31.getPageIndices());
			const add_copiedPage_31Att1 = await mergedPdf.copyPages(add_pdf_31Att1, add_pdf_31Att1.getPageIndices());
			this.genPercentIndex = 5;
			
			for(const copiedPage of add_copiedPage_21) mergedPdf.addPage(copiedPage);
			for(const copiedPage of add_copiedPage_21Att1) mergedPdf.addPage(copiedPage);
			for(const copiedPage of add_copiedPage_21Att2) mergedPdf.insertPage(mergedPdf.getPageCount() - 1, copiedPage);
			for(const copiedPage of add_copiedPage_31) mergedPdf.addPage(copiedPage);
			for(const copiedPage of add_copiedPage_31Att1) mergedPdf.addPage(copiedPage);

			this.template.basePdf = await mergedPdf.saveAsBase64({ dataUri: true });
			this.genPercent = this.genPercentArr[this.genPercentIndex];
			clearInterval(this.timer);
			this.viewer.updateTemplate(this.template);

			this.loading = false;
			this.genPDF = false;
			this.showPdfDialog = true;
		},
		async fetchPdf_weekly() {
			this.template = { "schemas": [], "basePdf": "" };
			const add_pdfUint8_22 = await this.$refs.PI22.getPDF();
			const add_pdfUint8_22Att1 = await this.$refs.PI22Att1.getPDF();
			const add_arrayBuffer_22Att2 = await this.$refs.PI22Att2.getPDF();
			const add_arrayBuffer_22Att3 = await this.$refs.PI22Att3.getPDF();
			const add_pdfUint8_32 = await this.$refs.PI32.getPDF();
			const add_arrayBuffer_32Att1 = await this.$refs.PI32Att1.getPDF();
			
			let add_pdfUint8_32Att2Arr = [ await this.$refs.PI32Att2.getPDF() ];
			if(this.perfPagesObj[302] && this.perfPagesObj[302][2]) {
				for (const caseSpec of this.perfPagesObj[302][2]) {
					const { id, initPage, perfPages } = caseSpec;
					await this.$refs.PI32Att2.setData(id, false, initPage, perfPages);
					// await new Promise(r => setTimeout(r, 1500));
					add_pdfUint8_32Att2Arr.push(await this.$refs.PI32Att2.getPDF());
				}
			}
			// console.log(add_pdfUint8_32Att2Arr);

			const add_pdfUint8_41 = await this.$refs.PI41.getPDF();
			const add_pdfUint8_41Att1 = await this.$refs.PI41Att1.getPDF();
			this.genPercentIndex = 3;

			const add_pdf_22 = await PDFDocument.load(add_pdfUint8_22.buffer);
			const add_pdf_22Att1 = await PDFDocument.load(add_pdfUint8_22Att1.buffer);
			const add_pdf_22Att2 = await PDFDocument.load(add_arrayBuffer_22Att2);
			const add_pdf_22Att3 = await PDFDocument.load(add_arrayBuffer_22Att3);
			const add_pdf_32 = await PDFDocument.load(add_pdfUint8_32.buffer);
			const add_pdf_32Att1 = await PDFDocument.load(add_arrayBuffer_32Att1);

			let add_pdf_32Att2Arr = [];
			for(const add_pdfUint8_32Att2 of add_pdfUint8_32Att2Arr) add_pdf_32Att2Arr.push(await PDFDocument.load(add_pdfUint8_32Att2.buffer));

			const add_pdf_41 = await PDFDocument.load(add_pdfUint8_41);
			const add_pdf_41Att1 = await PDFDocument.load(add_pdfUint8_41Att1.buffer);
			this.genPercentIndex = 4;

			const mergedPdf = await PDFDocument.create();
			const add_copiedPage_22 = await mergedPdf.copyPages(add_pdf_22, add_pdf_22.getPageIndices());
			const add_copiedPage_22Att1 = await mergedPdf.copyPages(add_pdf_22Att1, add_pdf_22Att1.getPageIndices());
			const add_copiedPage_22Att2 = await mergedPdf.copyPages(add_pdf_22Att2, add_pdf_22Att2.getPageIndices());
			const add_copiedPage_22Att3 = await mergedPdf.copyPages(add_pdf_22Att3, add_pdf_22Att3.getPageIndices());
			const add_copiedPage_32 = await mergedPdf.copyPages(add_pdf_32, add_pdf_32.getPageIndices());
			const add_copiedPage_32Att1 = await mergedPdf.copyPages(add_pdf_32Att1, add_pdf_32Att1.getPageIndices());

			let add_copiedPage_32Att2Arr = [];
			for(const add_pdf_32Att2 of add_pdf_32Att2Arr) add_copiedPage_32Att2Arr.push(await mergedPdf.copyPages(add_pdf_32Att2, add_pdf_32Att2.getPageIndices()));

			const add_copiedPage_41 = await mergedPdf.copyPages(add_pdf_41, add_pdf_41.getPageIndices());
			const add_copiedPage_41Att1 = await mergedPdf.copyPages(add_pdf_41Att1, add_pdf_41Att1.getPageIndices());
			this.genPercentIndex = 5;
			
			for(const copiedPage of add_copiedPage_22) mergedPdf.addPage(copiedPage);
			for(const copiedPage of add_copiedPage_22Att1) mergedPdf.addPage(copiedPage);
			for(const copiedPage of add_copiedPage_22Att2) mergedPdf.addPage(copiedPage);
			for(const copiedPage of add_copiedPage_22Att3) mergedPdf.addPage(copiedPage);
			for(const copiedPage of add_copiedPage_32) mergedPdf.addPage(copiedPage);
			for(const copiedPage of add_copiedPage_32Att1) mergedPdf.addPage(copiedPage);
			for(const add_copiedPage_32Att2 of add_copiedPage_32Att2Arr) for(const copiedPage of add_copiedPage_32Att2) mergedPdf.addPage(copiedPage);
			for(const copiedPage of add_copiedPage_41) mergedPdf.addPage(copiedPage);
			for(const copiedPage of add_copiedPage_41Att1) mergedPdf.addPage(copiedPage);

			const file = new File([await mergedPdf.save()], `${this.options.reportTypeMap[this.rowActive.reportType].name}_${this.formatDate(this.rowActive.reportDate)}.pdf`, { type: 'application/pdf' });
			const link = document.createElement('a');
			const url = URL.createObjectURL(file);
			link.href = url;
			link.download = file.name;
			document.body.appendChild(link);
			this.genPercent = this.genPercentArr[this.genPercentIndex];
			clearInterval(this.timer);

			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			this.loading = false;
			this.genPDF = false;
		},
		handleDownload() {
			this.$confirm(`<p>確定下載 ${this.formatDate(this.rowActive.reportDate)} ${this.options.reportTypeMap[this.rowActive.reportType].name}? <br/>(下載封存後將<span style="color: #F56C6C">無法修改</span>。)</p>`, "確認", { dangerouslyUseHTMLString: true, showClose: false }).then(() => {
				this.showPdfDialog = false;
				generate({ template: this.viewer.getTemplate(), inputs: [{}], options: { font: this.viewer.getFont() } }).then(pdf => {
					// console.log(pdf);
					// const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
					// window.open(URL.createObjectURL(blob));

					const file = new File([pdf], `${this.options.reportTypeMap[this.rowActive.reportType].name}_${this.formatDate(this.rowActive.reportDate)}.pdf`, { type: 'application/pdf' });
					const link = document.createElement('a');
					const url = URL.createObjectURL(file);
					link.href = url;
					link.download = file.name;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					URL.revokeObjectURL(url);
				});
			})
		},
		formatDate(date){
			return moment(date).isValid() ? moment(date).format('YYYY-MM-DD') : "-";
		},
	}
};
</script>

<style lang="sass">
	.perfReport-List
		.pdf-preview .el-dialog
			margin-top: 30px !important
			max-height: calc(100vh - 50px)
			.el-dialog__header, .el-dialog__body, .el-dialog__footer
				padding: 2px 10px
			.el-dialog__body > div > div
				max-height: calc(100vh - 100px)
			.el-dialog__footer
				position: absolute
				right: 5px
				bottom: 5px
</style>