<template>
	<div class="app-container PI2_2-Att_2" v-loading="loading">
		<h2>PI2.2附件-2</h2>

		<el-button v-if="pageTurn[0] != -1" icon="el-icon-arrow-left" size="mini" plain :disabled="pageTurn[0] == -1" @click="handlePageTurn(-1)">PI2.2附件</el-button>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn()">週報表</el-button>
		<span> > </span>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn(0)">{{ districtList[inputs.zipCode].name }} ({{ formatDate(reportDate) }})</el-button>
		<el-button v-if="pageTurn[1] != -1" type="primary" icon="el-icon-arrow-right" size="mini" plain :disabled="pageTurn[1] == -1"  @click="handlePageTurn(1)">PI2.2附件-3</el-button>

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
						<el-divider />
						<h3>被通報案件</h3>
						<el-table 
							:data="[...inputs.listOther, newItem]"
							empty-text="目前沒有資料"
							fit
							size="mini"
							:header-cell-style="{ 'background-color': '#F2F6FC', 'padding': '2px 0' }"
							style="width: 500px"
						>
							<el-table-column prop="reportDate" label="日期" width="60:" align="center">
								<template slot-scope="{ row }">
									<el-input v-if="!row.id" v-model = "row.reportDate" size="mini"/>
									<span v-else >{{ row.reportDate }}</span>
									
								</template>
							</el-table-column>
							<el-table-column prop="distressSrc" label="查驗項目" align="center">
								<template slot-scope="{ row }">
									<el-input v-if="!row.id" v-model = "row.distressSrc" size="mini"/>
									<span v-else>{{ row.distressSrc }}</span>
									
								</template>
							</el-table-column>
							<el-table-column prop="AC" label="路面" align="center">
								<el-table-column prop="AC_total" label="案件數" width="60" align="center">
									<template slot-scope="{ row }">
										<el-input v-if="!row.id || row.edit" v-model = "row.AC_total" size="mini"/>
										<span v-else>{{ row.AC_total }}</span>
									</template>
								</el-table-column>
								<el-table-column prop="AC_unreasonable" label="不合理" width="60" align="center">
									<template slot-scope="{ row }">
										<el-input v-if="!row.id || row.edit" v-model = "row.AC_unreasonable" size="mini"/>
										<span v-else>{{ row.AC_unreasonable }}</span>
									</template>
								</el-table-column>
							</el-table-column>
							<el-table-column prop="facility" label="設施" align="center">
								<el-table-column prop="facility_total" label="案件數" width="60" align="center">
									<template slot-scope="{ row }">
										<el-input v-if="!row.id || row.edit" v-model = "row.facility_total" size="mini"/>
										<span v-else>{{ row.facility_total }}</span>
									</template>
								</el-table-column>
								<el-table-column prop="facility_unreasonable" label="不合理" width="60" align="center">
									<template slot-scope="{ row }">
										<el-input v-if="!row.id || row.edit" v-model = "row.facility_unreasonable" size="mini"/>
										<span v-else>{{ row.facility_unreasonable }}</span>
									</template>
								</el-table-column>
							</el-table-column>
							<el-table-column label="操作" width="80" align="center">
								<template slot-scope="{ row }">
									<span v-if="row.id">
										<el-button-group v-if="row.edit">
											<el-button type="success" size="mini" icon="el-icon-check" style="padding: 5px" @click="rowEdit(row, false, false)" />
											<el-button type="danger" plain size="mini" icon="el-icon-close" style="padding: 5px" @click="rowEdit(row, false, true)" />
										</el-button-group>
										<el-button-group v-else>
											<el-button type="primary" plain size="mini" icon="el-icon-edit" style="padding: 5px 10px" @click="rowEdit(row, true)" />
											<el-button type="danger" plain size="mini" icon="el-icon-delete" style="padding: 5px"  @click="rowDel(row)" />
										</el-button-group>
									</span>
									<el-button v-else type="success" size="mini" @click="rowAdd(row)">新增</el-button>
								</template>
							</el-table-column>
						</el-table>
					</el-form>
				</el-card>
			</el-col>

			<!-- </div> -->

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
import { getCaseList, getPerfContent, setPerfContent } from "@/api/PI";
import TimePicker from '@/components/TimePicker';
import { dateWatcher } from "@/utils/pickerOptions";

export default {
	name: "PI2_2_Att_2",
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
				listOther: []
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
		rowAdd(row) {
			const idMax = this.inputs.listOther.length == 0 ? 0 : Math.max(...this.inputs.listOther.map(row => row.id));
			this.inputs.listOther.push({id: idMax+1, ...row});
			this.inputs.listOther.sort((a, b) => moment(a.reportDate).valueOf() - moment(b.reportDate).valueOf());
			this.previewPdf();

			this.newItem = {
				reportDate: moment(this.reportDate).format('MM/DD'),
				distressSrc: "",
				AC_total: 0,
				AC_unreasonable: 0,
				facility_total: 0,
				facility_unreasonable: 0
			};
		},
		rowEdit(row, isEdit, isReset) {
			if(isEdit) {
				this.rowActive = JSON.parse(JSON.stringify(row)); 
				row.edit = true;
			} else {
				if(isReset) {
					this.$set(row, 'AC_total', this.rowActive.AC_total);
					this.$set(row, 'AC_unreasonable', this.rowActive.AC_unreasonable);
					this.$set(row, 'facility_total', this.rowActive.facility_total);
					this.$set(row, 'facility_unreasonable', this.rowActive.facility_unreasonable);
				}
				row.edit = false;
			}

			// this.$set(this.inputs, 'listOther', this.inputs.listOther);
			this.previewPdf();
		},
		rowDel(row) {
			this.inputs.listOther = this.inputs.listOther.filter(rowSpec => rowSpec.id != row.id);
			this.previewPdf();
		},
		async getList() {
			new Promise((resolve, reject) => {
				this.loading = true;
				let timeStart = moment(this.reportDate).day() == 0 
					? moment(this.reportDate).day(-6).format("YYYY-MM-DD") 
					: moment(this.reportDate).day(1).format("YYYY-MM-DD");
				if(moment(timeStart).month() != moment(this.reportDate).month()) timeStart = moment(this.reportDate).startOf('month').format("YYYY-MM-DD");
				const timeEnd = moment(this.reportDate).add(1, "day").format("YYYY-MM-DD");
				dateWatcher(this.districtList[this.inputs.zipCode].start, [ timeStart, timeEnd ]);

				this.inputs.listOther = [];

				getCaseList({
					filterType: 2,
					caseType: 2,
					zipCode: this.inputs.zipCode,
					timeStart,
					timeEnd
				}).then(async (response) => {
					if (response.data.list.length != 0) {

						const list = response.data.list;
						this.inputs.listOther = list.filter(l => !l.DistressSrc.includes("1999") && l.StateNotes.Firm !== '優於民眾查報').reduce((acc, cur) => {
							const itemList = acc.filter(item => item.reportDate == moment(cur.ReportDate).format('MM/DD') && item.distressSrc == cur.DistressSrc);
							if(itemList.length == 0) {
								acc.push({
									id: acc.length+1,
									deviceType: cur.DeviceType,
									reportDate: moment(cur.ReportDate).format('MM/DD'),
									distressSrc: cur.DistressSrc,
									AC_total: cur.DeviceType == 1 ? 1 : 0,
									AC_unreasonable: cur.DeviceType == 1 && cur.State & 16 ? 1 : 0,
									facility_total: cur.DeviceType != 1 ? 1 : 0,
									facility_unreasonable: cur.DeviceType != 1 && cur.State & 16 ? 1 : 0,
									edit: false
								}) 

							} else {
								if(cur.DeviceType == 1) {
									itemList[0].AC_total++;
									if(cur.State & 16) itemList[0].AC_unreasonable++;
								} else {
									itemList[0].facility_total++;
									if(cur.State & 16) itemList[0].facility_unreasonable++;
								}
							}
							return acc
						}, []);
					}
					await this.previewPdf()
					resolve();
					this.loading = false;
				}).catch(err => { this.loading = false; });
			})
		},
		async createPdf_header(pageIndex) {
			return new Promise((resolve, reject) => {
				const { width, height } = this.pdfDoc.internal.pageSize;

				this.pdfDoc.setFontSize(15)
				this.pdfDoc.text(`成效式契約指標檢核表`, width/2, height-280, { align: 'center' });
				this.pdfDoc.setFontSize(12)
				this.pdfDoc.text(`項目:【PI-2.2附件】`, width-190, height-270, { align: 'left' })
				this.pdfDoc.text(`週報表`, width-40, height-270, { align: 'left' })
				this.pdfDoc.autoTable({
					theme: 'plain',
					styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10 },
					head: [['工程名稱',`${this.districtList[this.inputs.zipCode].tenderName}`,'紀錄編號',`${this.inputs.serialNumber}-${pageIndex+1}`]],
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
			return new Promise(async(resolve, reject) => {
				this.inputs.listOther.map(item => { 
					item.AC = String(item.AC_total) + ((item.AC_unreasonable != 0) ? `/${item.AC_unreasonable}` : "");
					item.facility = String(item.facility_total) + ((item.facility_unreasonable != 0) ? `/${item.facility_unreasonable}` : "");

					return item;
				})

				const splitTable = this.inputs.listOther.reduce((acc, cur) => {
					if(acc[acc.length-1].length <= 22) acc[acc.length-1].push(cur);
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
						head: [['當週被通報案件資料(附件請詳當日日報表)']],
						startY: this.pdfDoc.lastAutoTable.finalY,
					})

					this.pdfDoc.autoTable({
						columns: [
							{ dataKey: 'reportDate', header: '日期' },
							{ dataKey: 'distressSrc', header: '查驗項目' },
							{ dataKey: 'AC', header: '被查報案件數/不合理數(路面)' },
							{ dataKey: 'facility', header: '被查報案件數/不合理數(設施)' },
						],
						body: table,
						theme: 'plain',
						styles: { font: "edukai", fontSize: 12, lineWidth: 0.1, lineColor: 10, halign: 'center', valign: 'middle'	},
						columnStyles: { 
							reportDate: { cellWidth: 16 }, 
							distressSrc: { cellWidth: 'auto' }, 
							AC: { cellWidth: 60 }, 
							facility: { cellWidth: 60} 
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
			this.pdfDoc.save(`PI2-2附件-2.pdf`);
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
						path: "/PIReport/weekly/PI2_2_Att_1",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[0], cidList: this.$route.query.cidList }
					})
					break;
				case 1:
					this.$router.push({
						path: "/PIReport/weekly/PI2_2_Att_3",
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

<style lang="sass">
.PI2_2-Att_2
	.el-table .el-input .el-input__inner
		padding: 0
		text-align: center
</style>
