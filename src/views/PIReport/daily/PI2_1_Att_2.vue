<template>
	<div class="app-container PI2_1-Att_2" v-loading="loading">
		<h2>PI2.1附件-2</h2>

		<el-button v-if="pageTurn[0] != -1" icon="el-icon-arrow-left" size="mini" plain :disabled="pageTurn[0] == -1" @click="handlePageTurn(-1)">PI2.1附件</el-button>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn()">日報表</el-button>
		<span> > </span>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn(0)">{{ districtList[inputs.zipCode].name }} ({{ formatDate(reportDate) }})</el-button>
		<el-button v-if="pageTurn[1] != -1" type="primary" icon="el-icon-arrow-right" size="mini" plain :disabled="pageTurn[1] == -1"  @click="handlePageTurn(1)">PI3.1</el-button>

		<el-row :gutter="24">
			
			<el-col :span="11">
				<el-card shadow="never" style="width: 500px; margin: 40px auto; padding: 5px 10px; ">
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
						
						<el-form-item label="1999通報" style="width: 400px">
							<el-upload
								list-type="picture"
								action
								accept=".jpg" 
								:multiple="false" 
								:limit="1" 
								:auto-upload="false"
								:on-change="handleChange"
								:on-remove="handleRemove"
								:file-list="imgList"
							>
								<el-button type="primary" :disabled="imgList.length >= 1">上傳圖片</el-button>
							</el-upload>
						</el-form-item>
					</el-form>
				</el-card>
			</el-col>

			<!-- </div> -->

			<el-col :span="13">
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
import { getCaseList, getPerfContent, setPerfContent } from "@/api/PI";
import TimePicker from '@/components/TimePicker';
import { dateWatcher } from "@/utils/pickerOptions";

export default {
	name: "PI2_1_Att_2",
	components: {TimePicker },
	data() {
		return {
			loading: true,
			initPage: 2,
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
			imgList: [],
			inputs: {
				companyName: '聖東營造股份有限公司',
				formatDate:'',
				dateYear:'',
				zipCode: 104,
				district: '中山區',
				serialNumber1: '',
				serialNumber2: '',
				case1999Img: '',
				listNo1999: [],
				listUnreason: []
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
		} else this.$router.push({ path: "/PIReport/daily/list" });
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
							if(this.inputs.case1999Img.length != 0) this.imgList = [{ url: this.inputs.case1999Img }];
							this.initPage = initPage != 0 ? initPage : this.list.content.initPage;
							await this.previewPdf();
						} else await this.getList();
					}
					resolve();
					this.loading = false;
				}).catch(err => { this.loading = false; });
			});
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
				dateWatcher(this.districtList[this.inputs.zipCode].start, [this.reportDate, this.reportDate]);
				let startDate = moment(this.reportDate).format("YYYY-MM-DD");
				let endDate = moment(this.reportDate).add(1, "day").format("YYYY-MM-DD");

				this.inputs.listNo1999 = [];
				this.inputs.listUnreason = [];

				getCaseList({
					filterType: 2,
					caseType: 2,
					zipCode: this.inputs.zipCode,
					timeStart: startDate,
					timeEnd: endDate
				}).then(async (response) => {
					if (response.data.list.length != 0) {
						const list = response.data.list;
						this.inputs.listNo1999 = list.filter(l => l.DistressSrc !== "1999交辦案件");
						this.inputs.listUnreason = list.filter(l => (l.State & 16) && l.StateNotes.Firm !== '優於民眾查報');
					}
					await this.previewPdf()
					resolve();
					this.loading = false;
				}).catch(err => { this.loading = false; });
			})
		},
		async handleChange(file, fileList) {
			if(fileList.length > 1) fileList.shift();

			const reader = new FileReader();
			reader.readAsDataURL(file.raw);
			reader.onloadend = (evt) => {
				this.imgList = [{
					url: evt.target.result
				}];
				this.inputs.case1999Img = evt.target.result;

				this.previewPdf();
			};
		},
		handleRemove(file, fileList) {
			this.imgList = [];
			this.inputs.case1999Img = "";
			this.previewPdf();
		},
		headRows() {
			return [
				{ id: '案件編號', name: '通報者', item: '缺失項目', address:'地 點', reason:'原 因' },
			]
		},
		bodyRows(data) {
			// console.log(data);
			var body = []
			for (var j = 0; j <= data.length; j++) {
				if (data[j]) {
					// console.log(data[j]);
					body.push({
						id: data[j].UploadCaseNo,
						name: data[j].DistressSrc,
						item: this.deviceType[data[j].rDeviceType],
						address: data[j].CaseName,
						reason: data[j].StateNotes.Firm
					});
				}else {
					body.push({
						id: '',
						name: '',
						item: '',
						address: '',
					});
				}
			}

			return body
		},
		async createPdf_header(pageIndex) {
			return new Promise((resolve, reject) => {
				const { width, height } = this.pdfDoc.internal.pageSize;

				this.pdfDoc.setFontSize(15);
				this.pdfDoc.text(`成效式契約指標檢核表`, width/2, height-280, { align: 'center' });
				this.pdfDoc.setFontSize(12);
				this.pdfDoc.text(`項目:【PI-2.1附件】`, width-190, height-270, { align: 'left' })
				this.pdfDoc.text(`日報表`, width-40, height-270, { align: 'left' });

				this.pdfDoc.autoTable({
					theme: 'plain',
					styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10 },
					head: [['工程名稱',`${this.districtList[this.inputs.zipCode].tenderName}`,'紀錄編號',`${this.inputs.serialNumber1}-${pageIndex+1}`]],
					body: [['施工廠商',`${this.inputs.companyName}`,'檢查日期',`${this.inputs.formatDate}`]],
					startY: height-265,
				});

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
				if(this.inputs.case1999Img.length != 0) {
					// 獲取圖片實際高度寬度
					const image = new Image();
					image.src = this.inputs.case1999Img;
					await image.decode();
					this.imageWidth = image.width;
					this.imageHeight = image.height;
				}
				
				this.pdfDoc.addPage();
				while(this.pdfDoc.internal.getNumberOfPages() > 1) this.pdfDoc.deletePage(1);

				//第一頁
				await this.createPdf_header(0);
				
				this.pdfDoc.autoTable({
					theme: 'plain',
					styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10 },
					head: [['當日被通報案件(議員、單一陳情、管區……等)']],
					startY: this.pdfDoc.lastAutoTable.finalY,
				})
				let body1 = this.bodyRows(this.inputs.listNo1999)
				this.pdfDoc.autoTable({
					columns: [
						{ dataKey: 'id', header: '案件編號' },
						{ dataKey: 'name', header: '通報者' },
						{ dataKey: 'item', header: '缺失項目' },
						{ dataKey: 'address', header: '地 點' },
					],
					body: body1,
					theme: 'plain',
					styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10, halign: 'center'	},
					columnStyles: { id: { cellWidth:30 }, name: { cellWidth:30 }, item: { cellWidth:25 }, address: { cellWidth:'auto',halign:'left' } },
					startY: this.pdfDoc.lastAutoTable.finalY,
				})
				this.pdfDoc.autoTable({
					theme: 'plain',
					styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10 },
					head: [['當日被通報案件(1999)']],
					startY: this.pdfDoc.lastAutoTable.finalY,
				})
				this.pdfDoc.autoTable({
					theme: 'plain',
					styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10 },
					body: [[{content: '',styles: { minCellHeight: 40 }}]],
					didDrawCell: async (data) => {
						// 添加圖片到PDF中
						if (data.column.index === 0 && data.row.index === 0 && this.inputs.case1999Img.length != 0) {
							const cellWidth = data.cell.width;
							const cellHeight = data.cell.height;

							// 等比縮放
							let scale = 1;
							if (this.imageWidth > cellWidth || this.imageHeight > cellHeight) {
								const widthRatio = cellWidth / this.imageWidth;
								const heightRatio = cellHeight / this.imageHeight;
								scale = Math.min(widthRatio, heightRatio);
							}
							const scaledWidth = this.imageWidth * scale;
							const scaledHeight = this.imageHeight * scale;

							// 居中位置
							const x = data.cell.x + (cellWidth - scaledWidth) / 2;
							const y = data.cell.y + (cellHeight - scaledHeight) / 2;

							await this.pdfDoc.addImage(this.inputs.case1999Img, 'JPEG', x, y, scaledWidth, scaledHeight);
						}
					},
					startY: this.pdfDoc.lastAutoTable.finalY,
				})
				await this.createPdf_footer();

				// 第二頁
				this.pdfDoc.addPage(this.pdfSetting.format, this.pdfSetting.orientation);
				await this.createPdf_header(1);
				this.pdfDoc.autoTable({
					theme: 'plain',
					styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10 },
					head: [['當日廠商判定不合理案件(1999、議員、單一陳情、管區……等)']],
					startY: this.pdfDoc.lastAutoTable.finalY,
				})
				let head2 = this.headRows()
				let body2 = this.bodyRows(this.inputs.listUnreason)
				this.pdfDoc.autoTable({
					theme: 'plain',
					styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10, halign: 'center'},
					columnStyles: { id: { cellWidth:30 }, name: { cellWidth:30 }, item: { cellWidth:25 }, address: { cellWidth:50, halign:'left' }, reason: { halign:'left' } },
					head: head2,
					body: body2,
					startY: this.pdfDoc.lastAutoTable.finalY,
				})

				await this.createPdf_footer();

				resolve();
			})
		},
		formatFormData(){
			//日期格式
			const checkDate = moment(this.checkDate).subtract(1911, 'year');
			this.inputs.formatDate = checkDate.format("YYYY年MM月DD日").slice(1);
			
			const reportDate = moment(this.reportDate).subtract(1911, 'year');
			//民國年份
			this.inputs.dateYear = reportDate.year()
			//紀錄編號
			this.inputs.serialNumber1 = reportDate.format("YYYYMMDD01").slice(1) + String(this.initPage).padStart(2, '0');
			this.inputs.serialNumber2 = reportDate.format("YYYYMMDD01").slice(1) + String(this.initPage+1).padStart(2, '0');		
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
			let imgObj = {}; 
			let inputs = JSON.parse(JSON.stringify(this.inputs));

			Object.keys(this.inputs).forEach(key => {
				if(key.includes('Img')) {
					imgObj[key] = this.inputs[key];
					inputs[key] = "";
				}
			})


			const storedContent = {
				initPage: this.initPage,
				inputs
			}
			// console.log(storedContent, imgObj);

			setPerfContent(this.listQuery.perfContentId,{
				checkDate: moment(this.checkDate).format("YYYY-MM-DD"),
				pageCount: this.pdfDoc.internal.getNumberOfPages(),
				content: JSON.stringify(storedContent),
				imgObj
			}).then(response => {
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
			this.pdfDoc.save(`PI2-1附件-2.pdf`);
		},
		handlePageTurn(type) {
			switch(type) {
				case 0:
					this.$router.push({
						path: "/PIReport/daily/edit",
						query: { reportId: this.listQuery.reportId }
					})
					break;
				case -1:
					this.$router.push({
						path: "/PIReport/daily/PI2_1_Att_1",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[0], cidList: this.$route.query.cidList }
					})
					break;
				case 1:
					this.$router.push({
						path: "/PIReport/daily/PI3_1",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[1], cidList: this.$route.query.cidList }
					})
					break;
				default:
					const date = moment(this.reportDate).format("YYYY-MM-DD");
					this.$router.push({
						path: "/PIReport/daily/list",
						query: { zipCode: this.inputs.zipCode, timeStart: date, timeEnd: date }
					})
					break;
			}
		},
		formatDate(date){
			const momentDate = moment(date);
			return momentDate.isValid() ? momentDate.format('YYYY-MM-DD') : "-";
		}
	}
}
</script>

<style lang="sass"></style>
