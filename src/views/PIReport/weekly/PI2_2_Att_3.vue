<template>
	<div class="app-container PI2_2-Att_3" v-loading="loading">
		<h2>PI2.2附件-3</h2>

		<el-button v-if="pageTurn[0] != -1" icon="el-icon-arrow-left" size="mini" plain :disabled="pageTurn[0] == -1" @click="handlePageTurn(-1)">PI2.2附件-2</el-button>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn()">週報表</el-button>
		<span> > </span>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn(0)">{{ districtList[inputs.zipCode].name }} ({{ formatDate(reportDate) }})</el-button>
		<el-button v-if="pageTurn[1] != -1" type="primary" icon="el-icon-arrow-right" size="mini" plain :disabled="pageTurn[1] == -1"  @click="handlePageTurn(1)">PI3.2</el-button>

		<el-row :gutter="24">
			
			<el-col :span="12">
				<el-card shadow="never" style="width: 550px; margin: 40px auto; padding: 5px 10px; ">
					<el-form :model="inputs" label-width="100px">
						<div style="display:flex;justify-content:space-between;align-items: center">
							<h3>通報資訊</h3>
							<el-button-group>
								<el-button type="primary" plain icon="el-icon-document" size="small" @click="handleDownload()">輸出</el-button>
								<el-button type="info" icon="el-icon-refresh" size="small" @click="getList()">刷新</el-button>
								<el-button class="filter-item" type="success" icon="el-icon-document" size="small" @click="storeData">儲存</el-button>
							</el-button-group>
						</div>
						<!-- <el-button class="filter-item" type="primary" icon="el-icon-plus" @click="getList()">預覽</el-button> -->
						<!-- <el-button type="success" @click="storeData" style="margin: 10px" icon="el-icon-document">儲存</el-button> -->
						
						<el-divider />
						<el-form-item label="起始頁碼">
							<el-input-number v-model="initPage" controls-position="right" :min="1" style="width: 200px" @change="previewPdf()"/>
						</el-form-item>
						<el-form-item label="檢查日期">
							<el-date-picker
								v-model="checkDate"
								type="date"
								placeholder="日期"
								:picker-options="pickerOptions"
								:clearable="false"
								style="width: 200px"
								@change="previewPdf()"
							/>
						</el-form-item>
					</el-form>
				</el-card>
			</el-col>

			<el-col :span="12">
				<div ref="pdfViewer" />
			</el-col>
		</el-row>
	</div>
</template>

<script>
import moment from "moment";
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);
import { Viewer, BLANK_PDF } from '@pdfme/ui';
import { getCaseList, getInsCaseList, getPerfContent, setPerfContent } from "@/api/PI";
import TimePicker from '@/components/TimePicker';
import { dateWatcher } from "@/utils/pickerOptions";

export default {
	name: "PI2_2_Att_3",
	components: { TimePicker },
	data() {
		return {
			loading: true,
			initPage: 3,
			listQuery: {
				reportId: 0,
				perfContentId: null
			},
			checkDate: moment().startOf("d").subtract(1, "d"),
			reportDate: null,
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
			pdfSetting: {
				format: 'a4',
				fontSize: 14,
				lineHeight: (14 + 2) * 0.35,
				orientation: 'p'
			},
			districtList: {
				// 100: {
				// 	"name": "中正區"
				// },
				103: {
					"name": "大同區",
					"tenderName": "112年度大同區道路巡查維護修繕成效式契約",
					"start": "2023/2/1"
				},
				104: {
					"name": "中山區",
					"tenderName": "111年度中山區道路巡查維護修繕成效式契約",
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
			pageTurn: [-1, -1],
			options: {
				DeviceType: {},
			},
			imageWidth:null,
			imageHeight:null,
			// rowActive: {},
			newItem: {
				reportDate: "",
				distressSrc: "",
				AC_total: 0,
				AC_unreasonable: 0,
				facility_total: 0,
				facility_unreasonable: 0
			},
			imgList: [],
			inputs: {
				companyName: '聖東營造股份有限公司',
				formatDate:'',
				zipCode: 104,
				district: '中山區',
				serialNumber: '',
				listNonAccepted: []
			},
			deviceType:{
				1:'AC路面',
				2:'人行道',
				3:'側溝',
			},
			result:{}
		}
	},
	computed: {},
	watch: {
		"pdfSetting.fontSize"() {
			this.pdfSetting.lineHeight = (this.pdfSetting.fontSize + 2) * 0.35;
		}
	},
	created() {
		this.rowActive = {};
		if(this.$route.query.contentId) {
			this.listQuery.reportId = this.$route.query.reportId;
			this.listQuery.perfContentId = this.$route.query.contentId;

			const cidList = this.$route.query.cidList.split(",");
			const pageIndex = cidList.indexOf(String(this.$route.query.contentId));
			this.pageTurn = [ 
				Number(pageIndex) == 0 ? -1 : cidList[pageIndex-1], 
				Number(pageIndex) == cidList.length - 1 ? -1 : cidList[pageIndex+1] 
			];

			this.setData(this.listQuery.perfContentId);
		} else this.$router.push({ path: "/PIReport/weekly/list" });
	},
	mounted() { },
	methods: {
		async setData(perfContentId, initPage=0) {
			return new Promise(resolve => {
				getPerfContent({
					contentId: perfContentId
				}).then(async(response) => {
					if (response.data.list.length == 0) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
					} else {
						this.list = response.data.list[0];
						this.reportDate = this.list.reportDate;
						this.newItem.reportDate = moment(this.reportDate).format('MM/DD');
						this.checkDate = this.list.checkDate ? this.list.checkDate : this.list.reportDate;
						this.inputs.zipCode = this.list.zipCode;
						await this.initPDF();

						if(Object.keys(this.list.content).length != 0) {
							this.inputs = this.list.content.inputs;
							this.initPage = initPage != 0 ? initPage : this.list.content.initPage;
							await this.previewPdf();
						} else await this.getList();
					}
					resolve();
					this.loading = false;
				}).catch(err => { this.loading = false; });
			
			})
		},
		async initPDF() {
			return new Promise(resolve => {
				// 讀入字型
				const readBlob = (blob) => {
					return new Promise((resolve, reject) => {
						const reader = new FileReader();
						reader.onloadend = () => resolve(reader.result);
						reader.readAsDataURL(blob);
					});
				};
				
				fetch('/assets/font/edukai-4.0.ttf')
					.then(res => res.blob())
					.then(async(blob) => {
						this.viewer = new Viewer({
							domContainer: this.$refs.pdfViewer,
							template: {
								basePdf: BLANK_PDF,
								schemas: [{ }]
							},
							inputs: [{ }],
							options: {
								font:{
									edukai: {
										data: await blob.arrayBuffer(),
										fallback: true
									}
								}
							}
						});
						return readBlob(blob);
					})
					.then(dataUri => dataUri.substr(dataUri.indexOf('base64,') + 7))
					.then(fontBString => {
						// init jsPDF
						this.pdfDoc = new jsPDF();
						this.pdfDoc.addFileToVFS("edukai.ttf", fontBString);
						this.pdfDoc.addFont("edukai.ttf", "edukai", "normal");
						this.pdfDoc.setFont("edukai");

						resolve();
					});
			})
		},
		async getList() {
			new Promise((resolve, reject) => {
				this.loading = true;
				let timeStart = moment(this.reportDate).day() == 0 
					? moment(this.reportDate).day(-6).format("YYYY-MM-DD") 
					: moment(this.reportDate).day(1).format("YYYY-MM-DD");
				if(moment(timeStart).month() != moment(this.reportDate).month()) timeStart = moment(this.reportDate).startOf('month').format("YYYY-MM-DD");
				const timeEnd = moment(this.reportDate).add(1, "d").format("YYYY-MM-DD");
				dateWatcher(this.districtList[this.inputs.zipCode].start, [timeStart, timeEnd]);

				this.inputs.listNonAccepted = [];

				getCaseList({
					filterType: 2,
					caseType: 1,
					zipCode: this.inputs.zipCode,
					timeStart,
					timeEnd
				}).then((response1) => {
					if (response1.data.resultList.length != 0) this.inputs.listNonAccepted = response1.data.resultList;
					this.inputs.listNonAccepted.forEach(caseSpec => {
						caseSpec.CaseDate = moment(caseSpec.CaseDate).format('MM/DD');
						caseSpec.CaseNo = caseSpec.UploadCaseNo;
						caseSpec.type = 1;

						if (caseSpec.State & 32) {
							caseSpec.UploadCaseNoSV = caseSpec.UploadCaseNo;
							caseSpec.StateNotesSV = caseSpec.StateNotes.SV;
						}

						if (caseSpec.State & 64) {
							caseSpec.UploadCaseNoOrgan = caseSpec.UploadCaseNo;
							caseSpec.StateNotesOrgan = caseSpec.StateNotes.Organ;
						}
					})

					getInsCaseList({
						zipCode: this.inputs.zipCode,
						timeStart,
						timeEnd
					}).then(async (response2) => { 
						if (response2.data.resultList.length != 0) {
							const resultList = response2.data.resultList;
							resultList.forEach(caseSpec => {
								caseSpec.CaseDate = moment(caseSpec.DateUpload).format('MM/DD');
								caseSpec.State = caseSpec.PIState;
								caseSpec.type = 2;

								if (caseSpec.PIState & 32) {
									caseSpec.UploadCaseNoSV = caseSpec.CaseNo;
									caseSpec.StateNotesSV = JSON.parse(caseSpec.PIStateNotes).SV;
								}

								if (caseSpec.PIState & 64) {
									caseSpec.UploadCaseNoOrgan = caseSpec.CaseNo;
									caseSpec.StateNotesOrgan = JSON.parse(caseSpec.PIStateNotes).Organ;
								}
							})

							this.inputs.listNonAccepted.push(...resultList);
							this.inputs.listNonAccepted.sort((a, b) => a.CaseNo - b.CaseNo);
						}

						await this.previewPdf()
						resolve();
						this.loading = false;
					})
				}).catch(err => { this.loading = false; });
			})
		},
		async createPdf_header(pageIndex) {
			return new Promise((resolve, reject) => {
				const { width, height } = this.pdfDoc.internal.pageSize;

				this.pdfDoc.setFontSize(15);
				this.pdfDoc.text(`成效式契約指標檢核表`, width/2, height-280, { align: 'center' });
				this.pdfDoc.setFontSize(12);
				this.pdfDoc.text(`項目:【PI-2.2附件】`, width-190, height-270, { align: 'left' });
				this.pdfDoc.text(`週報表`, width-40, height-270, { align: 'left' });

				const serialNumber = `${this.inputs.serialNumber}` + (pageIndex == 0 ? "" : `-${pageIndex}`);
				this.pdfDoc.autoTable({
					theme: 'plain',
					styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10 },
					head: [['工程名稱',`${this.districtList[this.inputs.zipCode].tenderName}`,'紀錄編號',`${serialNumber}`]],
					body: [['施工廠商',`${this.inputs.companyName}`,'檢查日期',`${this.inputs.formatDate}`]],
					startY: height-265,
				})

				resolve();
			})
		},
		async createPdf_footer() {
			return new Promise((resolve, reject) => {
				this.pdfDoc.autoTable({
					theme: 'plain',
					styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10, minCellHeight: 20, valign: 'middle' },
					head: [['廠商:']],
					startY: this.pdfDoc.lastAutoTable.finalY,
				})
				resolve();
			})
		},
		async createPdf() {
			return new Promise(async (resolve, reject) => {
				const total = this.inputs.listNonAccepted.filter(l => l.type == 1).length;
				const totalSV = this.inputs.listNonAccepted.filter(l => l.type == 1 && l.State & 32).length;
				const totalOrgan = this.inputs.listNonAccepted.filter(l => l.type == 1 && l.State & 64).length;
				const totalP = this.inputs.listNonAccepted.filter(l => l.type == 2).length;
				const totalSVP = this.inputs.listNonAccepted.filter(l => l.type == 2 && l.State & 32).length;
				const totalOrganP = this.inputs.listNonAccepted.filter(l => l.type == 2 && l.State & 64).length;

				const splitTable = this.inputs.listNonAccepted.reduce((acc, cur) => {
					const rowLimit = acc.length == 1 ? 21 : 24;
					if(acc[acc.length-1].length <= rowLimit) acc[acc.length-1].push(cur);
					else acc.push([cur]);
					return acc;
				}, [[]]);

				for(const [ pageIndex, table ] of splitTable.entries()) {
					this.pdfDoc.addPage();
					while(pageIndex == 0 && this.pdfDoc.internal.getNumberOfPages() > 1) this.pdfDoc.deletePage(1);
					await this.createPdf_header(pageIndex);
					
					if(pageIndex == 0) {
						this.pdfDoc.autoTable({
							theme: 'plain',
							styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10 },
							head: [['認定不正確的案件數資訊: 無不正確']],
							startY: this.pdfDoc.lastAutoTable.finalY,
						})
						this.pdfDoc.autoTable({
							theme: 'plain',
							styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10, minCellHeight: 12, valign: 'middle', halign: 'center' },
							head: [['以下空白']],
							startY: this.pdfDoc.lastAutoTable.finalY,
						})
					}

					this.pdfDoc.autoTable({
						theme: 'plain',
						styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10 },
						head: [[`機關或專案管理/監造抽查檢核後發現錯誤的案件數資訊:\n      自巡: ${total} 件 (監造 ${totalSV}件 + 機關 ${totalOrgan}件) ， 環景: ${totalP} 件 (監造 ${totalSVP}件 + 機關 ${totalOrganP}件)`]],
						startY: this.pdfDoc.lastAutoTable.finalY,
					})
					this.pdfDoc.autoTable({
						columns: [
							{ dataKey: 'CaseDate', header: '日期' },
							{ dataKey: 'UploadCaseNoSV', header: '抽查案號(監造)' },
							{ dataKey: 'StateNotesSV', header: '被查報案件數/不合理數(監造)' },
							{ dataKey: 'UploadCaseNoOrgan', header: '抽查案號(機關)' },
							{ dataKey: 'StateNotesOrgan', header: '被查報案件數/不合理數(機關)' }
						],
						body: table,
						theme: 'plain',
						styles: { font: "edukai", lineWidth: 0.1, lineColor: 0, halign: 'center', valign: 'middle'	},
						headStyles: { textColor: 90, fillColor: 240 },
						columnStyles: { 
							CaseDate: { cellWidth: 14 }, 
							UploadCaseNoSV: { cellWidth: 27 }, 
							StateNotesSV: { cellWidth: 'auto' }, 
							UploadCaseNoOrgan: { cellWidth: 27 }, 
							StateNotesOrgan: { cellWidth: 'auto' } 
						},
						startY: this.pdfDoc.lastAutoTable.finalY,
					})

					await this.createPdf_footer();
				}
				resolve();
			})
		},
		formatFormData(){
			//日期格式
			const checkDate = moment(this.checkDate).format("YYYY/MM/DD").split("/");
			checkDate[0] = Number(checkDate[0]) - 1911;
			this.inputs.formatDate = `${checkDate[0]}年${checkDate[1]}月${checkDate[2]}日`;
			
			//紀錄編號
			const reportDate = moment(this.reportDate).format("YYYY/MM/DD").split("/");
			reportDate[0] = Number(reportDate[0]) - 1911;
			this.inputs.serialNumber = reportDate.join("") + "02" + String(this.initPage).padStart(2, '0');	
			//行政區
			this.inputs.district = this.districtList[this.inputs.zipCode].name		
		},
		async previewPdf() {
			return new Promise((resolve, reject) => {
				this.loading = true;
				this.formatFormData();
				this.createPdf().then(() => {
					const schemas = Array.from({ length: this.pdfDoc.internal.getNumberOfPages() }, () => ({}));

					this.result = this.pdfDoc.output('dataurlstring');
					this.viewer.updateTemplate({ basePdf: this.result, schemas });
					// console.log(this.result);
					resolve();
				})
				this.loading = false;
				
			})
			
		},
		storeData(){
			this.loading = true;
			const inputs = JSON.parse(JSON.stringify(this.inputs));
			const storedContent = {
				initPage: this.initPage,
				inputs
			}
			let uploadForm = new FormData();
			uploadForm.append('checkDate', moment(this.checkDate).format("YYYY-MM-DD"));
			uploadForm.append('pageCount', this.pdfDoc.internal.getNumberOfPages());
			uploadForm.append('content', JSON.stringify(storedContent));

			setPerfContent(this.listQuery.perfContentId, uploadForm).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "提交成功",
						type: "success",
					});
				} 
				this.loading = false;
			}).catch(err => {
				console.log(err);
				this.loading = false;
			})
		},
		async getPDF() {
			return new Promise(resolve =>{
				resolve(this.pdfDoc.output('arraybuffer'));
			});
		},
		handleDownload() {
			this.pdfDoc.save(`PI2-2附件-3.pdf`);
		},
		handlePageTurn(type) {
			switch(type) {
				case 0:
					this.$router.push({
						path: "/PIReport/weekly/edit",
						query: { reportId: this.listQuery.reportId }
					})
					break;
				case -1:
					this.$router.push({
						path: "/PIReport/weekly/PI2_2_Att_2",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[0], cidList: this.$route.query.cidList }
					})
					break;
				case 1:
					this.$router.push({
						path: "/PIReport/weekly/PI3_2",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[1], cidList: this.$route.query.cidList }
					})
					break;
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
	}
}
</script>

<style lang="sass"></style>
