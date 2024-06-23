<template>
	<div class="app-container PI3_2-Att_1" v-loading="loading">
		<h2>PI3.2附件</h2>

		<el-button v-if="pageTurn[0] != -1" icon="el-icon-arrow-left" size="mini" plain :disabled="pageTurn[0] == -1" @click="handlePageTurn(-1)">PI3.2</el-button>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn()">週報表</el-button>
		<span> > </span>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn(0)">{{ districtList[inputs.zipCode].name }} ({{ formatDate(reportDate) }})</el-button>
		<el-button v-if="pageTurn[1] != -1" type="primary" icon="el-icon-arrow-right" size="mini" plain :disabled="pageTurn[1] == -1"  @click="handlePageTurn(1)">
			<span v-if="list.content && Object.keys(list.content).length == 0">PI4.1</span>
			<span v-else>PI3.2附件-2</span>
		</el-button>

		<el-row :gutter="24">
			<el-col :span="12">
				<el-card shadow="never" style="width: 550px; margin: 40px auto; padding: 5px 10px; ">
					<el-form :model="inputs" label-width="100px">
						<div style="display: flex; justify-content: space-between; align-items: center">
							<h3>通報資訊</h3>
							<el-button-group>
								<el-button type="primary" plain icon="el-icon-document" size="small" @click="handleDownload()">輸出</el-button>
								<el-button type="info" icon="el-icon-refresh" size="small" @click="getList()">刷新</el-button>	
								<el-button class="filter-item" type="success" icon="el-icon-document" size="small" @click="storeData">儲存</el-button>
							</el-button-group>
						</div>
						
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
import { getCaseWarrantyList, getPerfContent, setPerfContent } from "@/api/PI";
import TimePicker from '@/components/TimePicker';

export default {
	name: "PI3_2_Att_1",
	components: { TimePicker },
	data() {
		return {
			loading: true,
			initPage: 5,
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
			headers: {
				UploadCaseNo: "案件編號",
				DistressSrc: "查報來源",
				CaseDate: "查報日期",
				Place: "查報地點",
				DateDeadline: "預計完工日期",
				DateCompleted: "實際完工時間"
			},
			list: [],
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
			imgList: [],
			inputs: {
				companyName: '聖東營造股份有限公司',
				formatDate:'',
				zipCode: 104,
				district: '中山區',
				serialNumber: '',
				caseList: []
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
	watch: { },
	created() {
		this.rowActive = {};
		if(this.$route.query.contentId) {
			this.listQuery.reportId = this.$route.query.reportId;
			this.listQuery.perfContentId = this.$route.query.contentId;

			this.cidList = this.$route.query.cidList.split(",");
			const pageIndex = this.cidList.indexOf(String(this.$route.query.contentId));
			this.pageTurn = [ 
				Number(pageIndex) == 0 ? -1 : this.cidList[pageIndex-1], 
				Number(pageIndex) == this.cidList.length - 1 ? -1 : this.cidList[pageIndex+1] 
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
				this.inputs.caseList = [];

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
					this.inputs.caseList = response.data.list;
					this.inputs.caseList.forEach(l => {
						l.CaseDate = this.formatTime(l.CaseDate);
						l.DateDeadline = this.formatTime(l.DateDeadline);
						l.DateCompleted = this.formatTime(l.DateCompleted);
					});
					this.inputs.caseList.sort((a,b) => a.UploadCaseNo - b.UploadCaseNo);
					await this.previewPdf();
					resolve();
					this.loading = false;
				}).catch(err => this.loading = false);
			})
		},
		async createPdf_header(pageIndex) {
			return new Promise((resolve, reject) => {
				const { width, height } = this.pdfDoc.internal.pageSize;

				this.pdfDoc.setFontSize(15);
				this.pdfDoc.text(`成效式契約指標檢核表`, width/2, height-280, { align: 'center' });
				this.pdfDoc.setFontSize(12);
				this.pdfDoc.text(`項目:【PI-3.2附件】`, width-190, height-270, { align: 'left' });
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
				const total = this.inputs.caseList.length;
				const splitTable = this.inputs.caseList.reduce((acc, cur) => {
					if(acc[acc.length-1].length <= 20) acc[acc.length-1].push(cur);
					else acc.push([cur]);
					return acc;
				}, [[]]);

				for(const [ pageIndex, table ] of splitTable.entries()) {
					this.pdfDoc.addPage();
					while(pageIndex == 0 && this.pdfDoc.internal.getNumberOfPages() > 1) this.pdfDoc.deletePage(1);
					await this.createPdf_header(pageIndex);

					this.pdfDoc.autoTable({
						theme: 'plain',
						styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10 },
						head: [[`本週預計完工案件列表: ${total} 件`]],
						startY: this.pdfDoc.lastAutoTable.finalY,
					})
					this.pdfDoc.autoTable({
						columns: [
							{ dataKey: 'UploadCaseNo', header: '案件編號' },
							{ dataKey: 'CaseDate', header: '查報日期' },
							{ dataKey: 'DistressSrc', header: '查報來源' },
							{ dataKey: 'Place', header: '查報地點' },
							{ dataKey: 'DateDeadline', header: '預計完工日期' },
							{ dataKey: 'DateCompleted', header: '實際完工日期' }
						],
						body: table.length == 0 ? [ { UploadCaseNo: '' } ] : table,
						theme: 'plain',
						styles: { font: "edukai", fontSize: 8, lineWidth: 0.1, lineColor: 10, halign: 'center', valign: 'middle', cellPadding: 1	},
						headStyles: { fontSize: 9, textColor: 90, fillColor: 240 },
						columnStyles: { 
							UploadCaseNo: { cellWidth: 20 }, 
							CaseDate: { cellWidth: 18 }, 
							DistressSrc: { cellWidth: 19 }, 
							Place: { cellWidth: 'auto', halign: 'left' }, 
							DateDeadline: { cellWidth: 22 }, 
							DateCompleted: { cellWidth: 22 } 
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
			const perfItems = [
				{
					"reportId": this.listQuery.reportId,
					"perfItem": 302,
					"perfAtt": [ 2 ],
					"perfPages": [ this.inputs.caseList.length ]
				}
			]
			let uploadForm = new FormData();
			uploadForm.append('checkDate', moment(this.checkDate).format("YYYY-MM-DD"));
			uploadForm.append('pageCount', this.pdfDoc.internal.getNumberOfPages());
			uploadForm.append('content', JSON.stringify(storedContent));
			uploadForm.append('perfItems', JSON.stringify(perfItems));

			setPerfContent(this.listQuery.perfContentId, uploadForm).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "提交成功",
						type: "success",
					});
				} 
				this.cidList = response.data.idList;
				this.list.content = storedContent;
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
			this.pdfDoc.save(`PI3-2附件.pdf`);
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
						path: "/PIReport/weekly/PI3_2",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[0], cidList: this.cidList.join(",") }
					})
					break;
				case 1:
					this.$router.push({
						path: "/PIReport/weekly/PI3_2_Att_2",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[1], perfPages: 1, cidList: this.cidList.join(",")}
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
		formatDate(date) {
			return moment(date).isValid() ? moment(date).format('YYYY-MM-DD') : "-";
		},
		formatTime(time) {
			return moment(time).isValid() ? moment(time).format('YYYY-MM-DD HH:mm') : "-";
		}
	}
}
</script>

<style lang="sass">
</style>
