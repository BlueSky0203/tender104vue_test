<template>
	<div class="app-container PI3_2-Att_2" v-loading="loading">
		<h2>PI3.2附件-2</h2>

		<el-button v-if="pageTurn[0] != -1" icon="el-icon-arrow-left" size="mini" plain :disabled="pageTurn[0] == -1" @click="handlePageTurn(-1)">
			<span v-if="listQuery.perfPages == 1">PI3.2附件</span>
			<span v-else>PI3.2附件-2 ({{ Number(listQuery.perfPages)-1 }})</span>
		</el-button>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn()">週報表</el-button>
		<span> > </span>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn(0)">{{ districtList[inputs.zipCode].name }} ({{ formatDate(reportDate) }})</el-button>
		<el-button v-if="pageTurn[1] != -1" type="primary" icon="el-icon-arrow-right" size="mini" plain :disabled="pageTurn[1] == -1"  @click="handlePageTurn(1)">
			<span v-if="caseList.length == listQuery.perfPages">PI4.1</span>
			<span v-else>PI3.2附件-2 ({{ Number(listQuery.perfPages)+1 }})</span>
		</el-button>

		<el-row :gutter="10">
			<el-col :span="12">
				<el-card shadow="never" style="width: 450px; margin: 20px auto; padding: 5px 10px;">
					<el-form :model="inputForm">
						<div style="display:flex;justify-content:space-between;align-items: center">
							<h3>檢核資訊</h3>
							<el-button-group>
								<el-button type="primary" plain icon="el-icon-document" size="small" @click="handleDownload()">輸出</el-button>
								<el-button type="info" icon="el-icon-refresh" size="small" @click="getList()">刷新</el-button>
								<el-button class="filter-item" type="success" icon="el-icon-document" size="small" @click="storeData">儲存</el-button>
							</el-button-group>
						</div>
						<el-divider />
						<el-form-item label="起始頁碼" :label-width="labelWidth1">
							<el-input-number v-model="initPage" controls-position="right" :min="1" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="檢查日期" :label-width="labelWidth1">
							<el-date-picker
								v-model="checkDate"
								type="date"
								placeholder="日期"
								:picker-options="pickerOptions"
								:clearable="false"
								style="width: 200px"
								@change="setPDFinputs"
							/>
						</el-form-item>
						<el-divider />
						
						<h4>案件資訊</h4>
						<el-form-item label="查報來源" :label-width="labelWidth1">
							<el-select v-model="inputs.distressSrc" placeholder="請選擇" style="width: 200px" @change="changeTemplate">
								<el-option v-for="(value, key) in srcList" :key="key" :label="value.name" :value="key" />
							</el-select>
						</el-form-item>
						<el-form-item label="案件編號" :label-width="labelWidth1">
							<el-input v-model="inputForm.caseNumber" style="width: 200px" @change="setPDFinputs">
								<el-link slot="append" icon="el-icon-link" :href="`https://road.nco.taipei/RoadMis2/web/ViewDefectAllData.aspx?RDT_ID=${inputForm.caseNumber}`" target="_blank" :underline="false" :disabled="inputForm.caseNumber.length == 0" style="width: 40px; height: 38px;"/>
							</el-input>
						</el-form-item>
						<el-form-item label="查報日期" :label-width="labelWidth1">
							<el-date-picker
								v-model="inputForm.checkReportDate"
								type="datetime"
								placeholder="日期"
								format="yyyy-MM-dd HH:mm"
								:clearable="false"
								style="width: 200px"
								@change="setPDFinputs"
							/>
						</el-form-item>
						<el-form-item v-if="['3'].includes(inputs.distressSrc)" label="收件時間" :label-width="labelWidth1">
							<el-date-picker
								v-model="inputForm.receivedDate"
								type="datetime"
								placeholder="日期"
								format="yyyy-MM-dd HH:mm"
								:clearable="false"
								style="width: 200px"
								@change="setPDFinputs"
							/>
						</el-form-item>
						<el-form-item v-if="['3'].includes(inputs.distressSrc)" label="第一階段完成日期" :label-width="labelWidth1">
							<el-date-picker
								v-model="inputForm.actualCompleteS1"
								type="datetime"
								placeholder="日期"
								format="yyyy-MM-dd HH:mm"
								:clearable="false"
								style="width: 200px"
								@change="setPDFinputs"
							/>
						</el-form-item>
						<el-form-item v-if="!(['3'].includes(inputs.distressSrc) && inputs.inspection == '0')" label="預計完工時間" :label-width="labelWidth1">
							<el-date-picker
								v-model="inputForm.expectedCompleteT"
								type="datetime"
								placeholder="日期"
								format="yyyy-MM-dd HH:mm"
								:clearable="false"
								style="width: 200px"
								@change="setPDFinputs"
							/>
						</el-form-item>
						<el-form-item v-if="!(['3'].includes(inputs.distressSrc) && inputs.inspection == '0')" label="實際施工時間" :label-width="labelWidth1">
							<el-date-picker
								v-model="inputForm.actualCompleteT"
								type="datetime"
								placeholder="日期"
								format="yyyy-MM-dd HH:mm"
								:clearable="false"
								style="width: 200px"
								@change="setPDFinputs"
							/>
						</el-form-item>
						<el-form-item label="施工說明" :label-width="labelWidth1">
							<el-select v-model.number="inputForm.completeFixed_Text" placeholder="套用模板" clearable @change="setPDFinputs">
								<el-option v-for="text in finishText" :key="text" :label="text" :value="text" />
							</el-select>
							<el-input
								v-model="inputForm.completeFixed_Text"
								type="textarea"
								:autosize="{ minRows: 2, maxRows: 4}"
								placeholder="請輸入" 
								style="width: 200px"
								@change="setPDFinputs" />
						</el-form-item>
						<el-form-item v-if="['3'].includes(inputs.distressSrc)" label="第一階段回報說明" :label-width="labelWidth1">
							<el-select v-model.number="inputForm.construction_Text" placeholder="套用模板" clearable @change="changeTemplate">
								<el-option v-for="text in constructionText" :key="text" :label="text" :value="text" />
							</el-select>
							<el-input
								v-model="inputForm.construction_Text"
								type="textarea"
								:autosize="{ minRows: 2, maxRows: 4}"
								placeholder="請輸入" 
								style="width: 200px"
								@change="setPDFinputs" />
						</el-form-item>
						<el-divider />

						<h4>照片</h4>
						<el-form-item label="施工前" :label-width="labelWidth1">
							<el-input v-model="inputForm.preconstruction_Img" style="width: 200px" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="施工後" :label-width="labelWidth1">
							<el-input v-model="inputForm.completeFixed_Img" style="width: 200px" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item v-if="['3'].includes(inputs.distressSrc)" label="第一階段回報" :label-width="labelWidth1">
							<el-input v-model="inputForm.construction_Img" style="width: 200px" @change="setPDFinputs" />
						</el-form-item>
					</el-form>
				</el-card>
			</el-col>
			<el-col :span="12" ref="container" class="container"/>
		</el-row>
	</div>
</template>

<script>
import moment from "moment";
import { generate } from '@pdfme/generator';
import { Form } from '@pdfme/ui';
import { PDFDocument } from 'pdf-lib';
import { getCaseWarrantyList, getPerfContent, setPerfContent } from "@/api/PI";

export default {
	name: "PI3_2-Att_2",
	components: { },
	data() {
		return {
			labelWidth1:'150px',
			labelWidth2:'20px',
			loading: true,
			initPage: 6,
			listQuery: {
				reportId: 0,
				perfContentId: null,
				perfPages: 0
			},
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
			checkDate: moment().startOf("d").subtract(1, "d"),
			reportDate: null,
			// list:[],
			// caseList: [],
			districtList: {
				// 100: {
				// 	"name": "中正區"
				// },
				103: {
					"name": "大同區",
					"tenderName": "112年度大同區道路巡查維護修繕成效式契約"
				},
				104: {
					"name": "中山區",
					"tenderName": "111年度中山區道路巡查維護修繕成效式契約"
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
			srcList: {
				1: {
					name: '廠商',
					json: { 0: 'PI3_2Att2t1.json', 1: 'PI3_2Att2t1.json' }
				},
				2: {
					name: '隊部',
					json: { 0: 'PI3_2Att2t1.json', 1: 'PI3_2Att2t1.json' }
				},
				3: {
					name: '1999',
					json: { 0: 'PI3_2Att2t2.json', 1: 'PI3_2Att2t3.json' }
				}
			},
			distressType: ['坑洞', '人孔高差', '縱橫向裂縫/龜裂', '車轍/隆起與凹陷', '人行道'],
			finishText: [
				'\n已修復完工(無須復標)',
				'\n已修復完工(已復標)',
				'\n本案分隊工班已派員修復完妥',
				'\n已請管區開立{{單位}}B單',
				'\n本案{{單位}}已派員改善完妥',
				'該缺失為路面輕微破損，經數日觀察後無變嚴重跡象，故判斷無立即危險，先行方正修復結案並持續觀察(無須復標)'
			],
			constructionText: [
				'\n佐證第一階段已交維處理之照片',
				'\n佐證第一階段已臨補處理之照片',
				'第一階段無處理之原因：\n'
			],
			pageTurn: [-1, -1],
			template: {},
			inputForm: {
				caseNumber: '',
				checkReportDate: '',
				expectedCompleteT: '',
				actualCompleteT: '',
				receivedDate: '',
				actualCompleteS1: '',
				completeFixed_Text: '',
				construction_Text: '',
				preconstruction_Img: '',
				completeFixed_Img: '',
				construction_Img: '',
			},
			inputs: {
				contractName: '111年度中山區道路巡查維護修繕成效式契約',//工程名稱
				serialNumber1: '11206250201',//紀錄編號
				serialNumber2: '11206250201-1',
				serialNumber3: '11206250202',
				companyName: '聖東營造股份有限公司',//施工廠商
				date: '',//檢查日期
				distressSrc: '1',
				inspection: '1',
				zipCode: '104',
				distressSrc_Text: '',
				caseNumber: '',
				completeFixed_Text: '',
				construction_Text: '',
				checkReportDate: '',
				expectedCompleteT: '',
				actualCompleteT: '',
				receivedDate: '',
				actualCompleteS1: '',
				checkReportData_Img: '', 
				dispatchData_Img: '',
				// completeReportData_Img: '',
				reportData1999_Img: '',
				preconstruction_Img: '',
				completeFixed_Img: '',
				construction_Img: ''
			},
		};
	},
	computed: { },
	watch: {
		"$route.query.perfPages"(newVal, oldVal) {
			if(newVal != oldVal) {
				this.loading = true;
				this.listQuery.perfContentId = this.$route.query.contentId;
				this.listQuery.perfPages = this.$route.query.perfPages;

				this.cidList = this.$route.query.cidList.split(",");
				const pageIndex = this.cidList.indexOf(String(this.$route.query.contentId));
				this.pageTurn = [ 
					Number(pageIndex) == 0 ? -1 : this.cidList[pageIndex-1], 
					Number(pageIndex) == this.cidList.length - 1 ? -1 : this.cidList[pageIndex+1] 
				];

				this.inputs = {
					contractName: '111年度中山區道路巡查維護修繕成效式契約',//工程名稱
					serialNumber1: '11206250201',//紀錄編號
					serialNumber2: '11206250201-1',
					serialNumber3: '11206250202',
					companyName: '聖東營造股份有限公司',//施工廠商
					date: '',//檢查日期
					distressSrc: '1',
					inspection: '1',
					zipCode: '104',
					distressSrc_Text: '',
					caseNumber: '',
					completeFixed_Text: '',
					construction_Text: '',
					checkReportDate: '',
					expectedCompleteT: '',
					actualCompleteT: '',
					receivedDate: '',
					actualCompleteS1: '',
					checkReportData_Img: '', 
					dispatchData_Img: '',
					completeReportData_Img: '',
					reportData1999_Img: '',
					preconstruction_Img: '',
					completeFixed_Img: '',
					construction_Img: ''
				};

				this.inputForm = {
					caseNumber: '',
					checkReportDate: '',
					expectedCompleteT: '',
					actualCompleteT: '',
					receivedDate: '',
					actualCompleteS1: '',
					completeFixed_Text: '',
					construction_Text: '',
					preconstruction_Img: '',
					completeFixed_Img: '',
					construction_Img: '',
				};

				this.setData(this.listQuery.perfContentId, false);
			}
		}
	},
	async created() {	
		this.caseList = [];
		this.schemasOri = {};

		if(this.$route.query.reportId && this.$route.query.contentId && this.$route.query.perfPages) {
			this.listQuery.reportId = this.$route.query.reportId;
			this.listQuery.perfContentId = this.$route.query.contentId;
			this.listQuery.perfPages = this.$route.query.perfPages;
			this.initPage = this.initPage + Number(this.listQuery.perfPages) - 1; 

			this.cidList = this.$route.query.cidList.split(",");
			const pageIndex = this.cidList.indexOf(String(this.$route.query.contentId));
			this.pageTurn = [ 
				Number(pageIndex) == 0 ? -1 : this.cidList[pageIndex-1], 
				Number(pageIndex) == this.cidList.length - 1 ? -1 : this.cidList[pageIndex+1] 
			];

			this.setData(this.listQuery.perfContentId);
		} else this.$router.push({ path: "/PIReport/weekly/list" });	
	},
	mounted() {},
	methods: {
		async setData(perfContentId, init=true, initPage=0, perfPages=0) {
			return new Promise(resolve => {
				getPerfContent({
					contentId: perfContentId
				}).then(async (response) => {
					if (response.data.list.length == 0) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
					} else {
						this.list = response.data.list[0];

						// 如PI3-2附件尚未建立，則跳過
						if(this.list.perfPages == 0) {
							if(this.listQuery.perfPages == 1) {
								this.$router.push({
									path: "/PIReport/weekly/PI4_1",
									query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[1], cidList: this.cidList.join(",") }
								})
							} else if(this.listQuery.perfPages == -1) {
								this.$router.push({
									path: "/PIReport/weekly/PI3_2_Att_1",
									query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[0], cidList: this.cidList.join(",") }
								})
							}
							return;
						}

						if(Object.keys(this.list.content).length != 0) {
							this.inputs = this.list.content.inputs;

							// NOTE: 將image轉成dataURI (不然pdfme generate會報錯)
							const fetchImg = async (key) => {
								return new Promise( resolve => {
									fetch(this.inputs[key])
										.then(res => res.blob())
										.then(blob => {
											const reader = new FileReader();
											reader.onloadend = () => { 
												this.inputs[key] = reader.result; 
												resolve();
											};
											reader.readAsDataURL(blob);
										})
								})
							};

							let fetchImgList = [];
							for(const key in this.inputs) {
								if(key.includes('Img') && this.inputs[key] && this.inputs[key].length != 0) {
									fetchImgList.push(fetchImg(key));
								}
							}
							await Promise.all(fetchImgList);

							this.initPage = initPage != 0 ? initPage : this.list.content.initPage;
							this.listQuery.perfPages = perfPages != 0 ? perfPages : this.listQuery.perfPages;
						}
						this.reportDate = this.list.reportDate;
						this.checkDate = this.list.checkDate ? this.list.checkDate : this.list.reportDate;
						this.inputs.zipCode = String(this.list.zipCode);

						// await new Promise(r => setTimeout(r, 1500));

						if(init) await this.initPDF();
						else {
							for await (const promise of Object.entries(this.inputs).map(([key, value])  => this.changeInput({ key, value })) );
							// await new Promise(r => setTimeout(r, 1000));
							await this.getList(Object.keys(this.list.content).length == 0);
						}
					}

					resolve();
					// this.loading = false;
				}).catch(err => { this.loading = false; });
			})
		},
		async initPDF() {
			return new Promise(resolve => {
				const fileName = this.srcList[this.inputs.distressSrc].json[this.inputs.inspection];

				fetch(`/assets/pdf/weekly/${fileName}?t=${Date.now()}`).then(async (response) => {
					const domContainer = this.$refs.container.$el;
					this.template = await response.json();

					const font = {
						edukai: {
							data: await fetch('/assets/font/edukai-4.0.ttf').then(res => res.arrayBuffer()),
							fallback: true
						}
					};
					if(this.form) this.form.destroy();	
					this.form = new Form({ domContainer, template: this.template, inputs: [ this.inputs ], options: { font } });
					this.form.onChangeInput(arg => this.changeInput(arg));

					for await (const promise of Object.entries(this.inputs).map(([key, value])  => this.changeInput({ key, value })) );
					await this.getList(Object.keys(this.list.content).length == 0);
					resolve();
				})
			})
		},
		async changeInput(arg) {
			return new Promise(async resolve=> {
				if(['caseNumber', 'completeFixed_Text', 'construction_Text'].includes(arg.key)) this.inputForm[arg.key] = arg.value;
				if(['checkReportDate', 'receivedDate', 'actualCompleteS1', 'expectedCompleteT', 'actualCompleteT', ].includes(arg.key)) {
					if(moment(arg.value).isValid()) {
						const dateArr = arg.value.split("/");
						this.inputForm[arg.key] = `${Number(dateArr[0]) + 1911}/${dateArr[1]}/${dateArr[2]}`;
					} else this.inputForm[arg.key] = '';
				}

				const aspectRatioImgList = [];
				if(['checkReportData_Img', 'dispatchData_Img', 'completeReportData_Img', 'reportData1999_Img',  'preconstruction_Img', 'completeFixed_Img', 'construction_Img'].includes(arg.key)) {
					if(arg.value != undefined) {
						this.inputs[arg.key] = this.inputForm[arg.key] = arg.value;
						if(arg.value && arg.value.length != 0) aspectRatioImgList.push(this.aspectRatioImg(arg));
					}
				}
				await Promise.all(aspectRatioImgList);
				resolve();
			})
		},
		async changeTemplate() {
			return new Promise(resolve => {
				// this.loading = true;
				const fileName = this.srcList[this.inputs.distressSrc].json[this.inputs.inspection];
				// console.log(fileName);
				fetch(`/assets/pdf/weekly/${fileName}?t=${Date.now()}`).then(async (response) => {
					this.template = await response.json();
					if(this.inputs.distressSrc == '3' && this.inputForm.construction_Text.includes('第一階段無處理')) {
						//Step1: 替換第二頁PDF
						const ori_pdfUint8 = Uint8Array.from(window.atob(this.template.basePdf.replace(/^data:application\/pdf;base64,/, '')), c => c.charCodeAt(0));
						const ori_pdf = await PDFDocument.load(ori_pdfUint8.buffer);
						ori_pdf.removePage(1);

						let fileNameSpec = fileName.split(".");
						fileNameSpec.splice(1, 0, "_1", ".");
						fileNameSpec = fileNameSpec.join("");
						const addTemplate = await fetch(`/assets/pdf/weekly/${fileNameSpec}?t=${Date.now()}`).then(response => response.json());
						const add_pdfUint8 = Uint8Array.from(window.atob(addTemplate.basePdf.replace(/^data:application\/pdf;base64,/, '')), c => c.charCodeAt(0));
						const add_pdf = await PDFDocument.load(add_pdfUint8.buffer);
						const mergedPdf = await PDFDocument.create();

						const ori_copiedPages = await mergedPdf.copyPages(ori_pdf, ori_pdf.getPageIndices());
						const [ add_copiedPage ] = await mergedPdf.copyPages(add_pdf, [0]);
						ori_copiedPages.forEach(page => mergedPdf.addPage(page));
						mergedPdf.addPage(add_copiedPage);

						this.template.basePdf = await mergedPdf.saveAsBase64({ dataUri: true });

						//Step2: 調整欄位
						this.template.schemas.splice(this.template.schemas.length-1, 1, addTemplate.schemas[0]);
					}

					if(this.caseList.length == this.listQuery.perfPages) {
						//Step1: 合併PDF
						const ori_pdfUint8 = Uint8Array.from(window.atob(this.template.basePdf.replace(/^data:application\/pdf;base64,/, '')), c => c.charCodeAt(0));
						const ori_pdf = await PDFDocument.load(ori_pdfUint8.buffer);
						const addTemplate = await fetch(`/assets/pdf/weekly/PI3_2Att3.json?t=${Date.now()}`).then(response => response.json());
						const add_pdfUint8 = Uint8Array.from(window.atob(addTemplate.basePdf.replace(/^data:application\/pdf;base64,/, '')), c => c.charCodeAt(0));
						const add_pdf = await PDFDocument.load(add_pdfUint8.buffer);
						
						const mergedPdf = await PDFDocument.create();
						const ori_copiedPages = await mergedPdf.copyPages(ori_pdf, ori_pdf.getPageIndices());
						const [ add_copiedPage ] = await mergedPdf.copyPages(add_pdf, [0]);
						for(const copiedPage of ori_copiedPages) mergedPdf.addPage(copiedPage);
						mergedPdf.addPage(add_copiedPage);
						this.template.basePdf = await mergedPdf.saveAsBase64({ dataUri: true });

						//Step2: 調整欄位
						this.template.schemas.push(addTemplate.schemas[0]);
					}
					this.schemasOri = {};
					this.form.updateTemplate(this.template);
					// this.form.render();

					// await new Promise(r => setTimeout(r, 500));
					await this.setPDFinputs();
					resolve();
				
					this.loading = false;
				})
			})
		},
		async aspectRatioImg(arg) {
			return new Promise(resolve=> {
				const keyArray = this.template.schemas.map(item => Object.keys(item));
				const keyIndex = keyArray.findIndex(el => el.includes(arg.key));
				// console.log(this.template.schemas.length, keyIndex, arg.key, arg.value);
				if(keyIndex == -1) return resolve();
				if(this.schemasOri[arg.key]) {
					this.template.schemas[keyIndex][arg.key] = JSON.parse(JSON.stringify(this.schemasOri[arg.key]));
					delete this.schemasOri[arg.key];
					this.form.updateTemplate(this.template);
				}

				const img = new Image();
				img.onload = () => {
					// 照片壓縮
					// const canvas = document.createElement('canvas');
					// // console.log("image: ", img.width, img.height);
					// const scale = Math.max(img.width, img.height) >= 1024 ? 1024/Math.max(img.width, img.height) : 1;
					// canvas.width = img.width * scale;
					// canvas.height = img.height * scale;
					// const canvasContext = canvas.getContext('2d');
					// canvasContext.drawImage(img, 0, 0, canvas.width, canvas.height);
					// this.inputs[arg.key] = canvas.toDataURL("image/jpeg", 0.8);
					
					// 調整比例
					const templateWidth = this.template.schemas[keyIndex][arg.key].width;
					const templateHeight = this.template.schemas[keyIndex][arg.key].height;
					const ratio = Math.min(templateWidth / img.width, templateHeight / img.height);
					// console.log(ratio);

					this.schemasOri[arg.key] = JSON.parse(JSON.stringify(this.template.schemas[keyIndex][arg.key]));
					this.template.schemas[keyIndex][arg.key].position.x = this.template.schemas[keyIndex][arg.key].position.x + (this.template.schemas[keyIndex][arg.key].width - img.width * ratio) / 2;
					this.template.schemas[keyIndex][arg.key].position.y = this.template.schemas[keyIndex][arg.key].position.y + (this.template.schemas[keyIndex][arg.key].height - img.height * ratio) / 2;
					this.template.schemas[keyIndex][arg.key].width = img.width * ratio;
					this.template.schemas[keyIndex][arg.key].height = img.height * ratio;
					this.form.updateTemplate(this.template);

					resolve();
				}

				if(arg.value.length == 0) resolve();
				else img.src = arg.value;
			})
		},
		async setPDFinputs() {
			return new Promise(async resolve=> {
				//工程名稱
				const reportDate = moment(this.reportDate).format("YYYY/MM/DD").split("/");
				reportDate[0] = Number(reportDate[0]) - 1911;
				this.inputs.contractName = this.districtList[this.inputs.zipCode].tenderName;
				//紀錄編號
				this.inputs.serialNumber1 = reportDate.join("") + "02" + String(this.initPage).padStart(2, '0');	
				this.inputs.serialNumber2 = reportDate.join("") + "02" + String(this.initPage).padStart(2, '0') + "-1";	
				this.inputs.serialNumber3 = reportDate.join("") + "02" + String(this.initPage+1).padStart(2, '0');	
				//檢查日期
				const checkDate = moment(this.checkDate).format("YYYY/MM/DD").split("/");
				checkDate[0] = Number(checkDate[0]) - 1911;
				this.inputs.date = `${checkDate[0]}年${checkDate[1]}月${checkDate[2]}日`;
				//查報來源
				this.inputs.distressSrc_Text = (this.inputs.distressSrc == '1') ? '自主' : (this.inputs.distressSrc == '2') ? '隊部' : '';

				for(const key of ['caseNumber', 'completeFixed_Text', 'construction_Text']) {
					this.inputs[key] = String(this.inputForm[key]);
				}

				for(const key of ['checkReportDate',  'receivedDate', 'actualCompleteS1', 'expectedCompleteT', 'actualCompleteT']) {
					const dateTime = moment(this.inputForm[key]);
					if(dateTime.isValid()) {
						const dateTimeArr = dateTime.format("YYYY/MM/DD HH:mm").split("/");
						dateTimeArr[0] = Number(dateTimeArr[0]) - 1911;
						this.inputs[key] = dateTimeArr.join("/");
					} else this.inputs[key] = '';
				}

				const aspectRatioImgList = [];
				for(const key of ['checkReportData_Img', 'dispatchData_Img', 'completeReportData_Img', 'reportData1999_Img',  'preconstruction_Img', 'completeFixed_Img', 'construction_Img']) {
					if(this.inputForm[key] != undefined && this.inputForm[key].length != 0) {
						this.inputs[key] = this.inputForm[key];
						aspectRatioImgList.push(this.aspectRatioImg({ key, value: this.inputs[key] }));
					} 
				}
				
				await Promise.all(aspectRatioImgList)
				this.form.setInputs([this.inputs]);
				this.form.render();

				resolve();
			})
		},
		async getList(isReplace = true) {
			return new Promise(resolve => {
				this.loading = true;
				this.caseList = [];

				let timeStart = moment(this.reportDate).day() == 0 
					? moment(this.reportDate).day(-6).subtract(8, 'hours').format("YYYY-MM-DD HH:mm:ss") 
					: moment(this.reportDate).day(1).subtract(8, 'hours').format("YYYY-MM-DD HH:mm:ss");
				if(moment(timeStart).month() != moment(this.reportDate).month()) timeStart = moment(this.reportDate).startOf('month').subtract(8, 'hours').format("YYYY-MM-DD HH:mm:ss");
				const timeEnd = moment(this.reportDate).startOf('day').add(1, "d").subtract(8, 'hours').format("YYYY-MM-DD HH:mm:ss");

				getCaseWarrantyList({
					zipCode: Number(this.inputs.zipCode),
					caseType: 1,
					filterType: 2,
					timeStart,
					timeEnd
				}).then(async(response) => {
					this.caseList = response.data.list;
					this.caseList.sort((a,b) => a.UploadCaseNo - b.UploadCaseNo);

					if(Number(this.listQuery.perfPages) < 0) this.listQuery.perfPages = Number(this.listQuery.perfPages) + this.caseList.length + 1;

					if(isReplace) {
						const caseSpec = this.caseList[this.listQuery.perfPages-1];
						this.inputForm.caseNumber = caseSpec.UploadCaseNo;
						this.inputForm.checkReportDate = moment(caseSpec.CaseDate).format("YYYY-MM-DD HH:mm:ss");
						this.inputForm.expectedCompleteT = moment(caseSpec.DateDeadline).format("YYYY-MM-DD HH:mm:ss");
						this.inputForm.actualCompleteT = moment(caseSpec.DateCompleted).format("YYYY-MM-DD HH:mm:ss");
						this.inputs.distressSrc = caseSpec.DistressSrc.includes("1999") ? '3' : caseSpec.DistressSrc.includes("隊部") ? '2' : '1';
						this.inputs.inspection = (caseSpec.State & 2) ? '1' : '0';
					}

					await this.changeTemplate();
					resolve();
					// resolve();
					// this.loading = false;
				}).catch(err => this.loading = false);
			})
		},
		storeData(){
			this.loading = true;
			let imgObj = {}; 
			const inputs = JSON.parse(JSON.stringify(this.inputs));

			Object.keys(this.inputs).forEach(key => {
				if(key.includes('Img')) {
					imgObj[key] = this.inputs[key];
					inputs[key] = "";
				}
			})
			const storedContent = {
				initPage: this.initPage,
				inputs: this.inputs
			}
			let uploadForm = new FormData();
			uploadForm.append('caseNo', Number(this.inputForm.caseNumber));
			uploadForm.append('checkDate', moment(this.checkDate).format("YYYY-MM-DD"));
			uploadForm.append('pageCount', ((['3'].includes(this.inputs.distressSrc)) ? 2 : 1) + (this.caseList.length == this.listQuery.perfPages ? 1 : 0));
			uploadForm.append('content', JSON.stringify(storedContent));
			uploadForm.append('imgObj', JSON.stringify(imgObj));

			setPerfContent(this.listQuery.perfContentId, uploadForm).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "提交成功",
						type: "success",
					});
					this.cidList = response.data.idList;
				} 
				this.loading = false;
			}).catch(err => {
				console.log(err);
				this.loading = false;
			})
		},
		async getPDF() {
			return new Promise(resolve =>{
				generate({ template: this.form.getTemplate(), inputs: this.form.getInputs(), options: { font: this.form.getFont() } }).then((pdf) => {
					resolve(pdf);
				});
			});
		},
		handleDownload() {
			// console.log(this.form);
			generate({ template: this.form.getTemplate(), inputs: this.form.getInputs(), options: { font: this.form.getFont() } }).then((pdf) => {
				// console.log(pdf);
				const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
				// window.open(URL.createObjectURL(blob));

				const filename = "PI3-2附件-2.pdf"; 
				const file = new File([blob], filename, { type: 'application/pdf' });
				const link = document.createElement('a');
				const url = URL.createObjectURL(file);
				link.href = url;
				// console.log(link,url);
				link.download = file.name;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
			});
		},
		handlePageTurn(type) {
			switch(type) {
				case 0:
					this.$router.push({
						path: "/PIReport/weekly/edit",
						query: { reportId: this.listQuery.reportId }
					})
					return;
				case -1:
					if(this.listQuery.perfPages == 1) {
						this.$router.push({
							path: "/PIReport/weekly/PI3_2_Att_1",
							query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[0], cidList: this.cidList.join(",") }
						})
					} else {
						this.$router.push({
							path: "/PIReport/weekly/PI3_2_Att_2",
							query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[0], perfPages: Number(this.listQuery.perfPages) - 1, cidList: this.cidList.join(",") }
						})
						this.initPage--;
					}
					return;
				case 1:
					if(this.caseList.length == this.listQuery.perfPages) {
						this.$router.push({
							path: "/PIReport/weekly/PI4_1",
							query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[1], cidList: this.cidList.join(",") }
						})
					} else {
						this.$router.push({
							path: "/PIReport/weekly/PI3_2_Att_2",
							query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[1], perfPages: Number(this.listQuery.perfPages) + 1, cidList: this.cidList.join(",") }
						})
						this.initPage++;
					}
					return;
				default:
					const date = moment(this.reportDate).format("YYYY-MM-DD");
					this.$router.push({
						path: "/PIReport/weekly/list",
						query: { zipCode: this.inputs.zipCode, timeStart: date, timeEnd: date }
					})
					break;
			}
		},
		formatDate(date){
			return moment(date).isValid() ? moment(date).format('YYYY-MM-DD') : "-";
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.PI3_2-Att_2
	.el-input-group__append
		padding: 0
</style>