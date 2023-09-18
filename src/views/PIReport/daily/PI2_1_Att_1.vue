<template>
	<div class="app-container PI2_1-Att_1" v-loading="loading">
		<h2>PI2.1附件</h2>

		<el-button v-if="pageTurn[0] != -1" icon="el-icon-arrow-left" size="mini" plain :disabled="pageTurn[0] == -1" @click="handlePageTurn(-1)">PI2.1</el-button>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn()">日報表</el-button>
		<span> > </span>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn(0)">{{ districtList[inputs.zipCode].name }} ({{ formatDate(reportDate) }})</el-button>
		<el-button v-if="pageTurn[1] != -1" type="primary" icon="el-icon-arrow-right" size="mini" plain :disabled="pageTurn[1] == -1"  @click="handlePageTurn(1)">PI2.1附件-2</el-button>

		<el-row :gutter="24">
			<el-col :span="10">
				<el-card shadow="never" style="width: 400px; margin: 40px auto; padding: 5px 10px;">
					<el-form :model="inputForm" label-width="100px">
						<div style="display:flex;justify-content:space-between;align-items: center">
							<h3>通報資訊</h3>
							<el-button-group>
								<el-button type="primary" plain icon="el-icon-document" size="small" @click="handleDownload()">輸出</el-button>
								<el-button type="info" icon="el-icon-refresh" size="small" @click="getList()">刷新</el-button>
								<el-button class="filter-item" type="success" icon="el-icon-document" size="small" @click="storeData">儲存</el-button>
							</el-button-group>
						</div>
						
						<el-divider />
						<el-form-item label="起始頁碼">
							<el-input-number v-model="initPage" controls-position="right" :min="1" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="檢查日期" >
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

						<h3>系統登錄</h3>
						<h4>路面: </h4>
						<el-form-item label="觀察區">
							<el-input-number v-model="inputForm.ACTotal_Obs" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="正式區">
							<el-input-number v-model="inputForm.ACTotal_Reg" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>

						<h4>設施: </h4>
						<el-form-item label="觀察區">
							<el-input-number v-model="inputForm.facTotal_Obs" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="正式區">
							<el-input-number v-model="inputForm.facTotal_Reg" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
					</el-form>
				</el-card>
			</el-col>
			<el-col :span="14" ref="container" />
		</el-row>
	</div>
</template>

<script>
import moment from "moment";
import { generate } from '@pdfme/generator';
import { Form } from '@pdfme/ui';
import { getCaseCount, getPerfContent, setPerfContent } from "@/api/PI";

export default {
	name: "PI2_1_Att_1",
	components: { },
	data() {
		return {
			loading: true,
			initPage: 2,
			listQuery: {
				reportId: 0,
				perfContentId: null
			},
			dateTimePickerVisible: false,
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
			pageTurn: [-1, -1],
			template: {},
			inputForm: {
				caseReportTotal: 0,
				ACTotal_Obs: 0,
				ACTotal_Reg: 0,
				facTotal_Obs: 0,
				facTotal_Reg: 0
			},
			inputs: {
				contractName: '111年度中山區道路巡查維護修繕成效式契約', 
				companyName: '聖東營造股份有限公司',
				serialNumber_21Att_1: '1111102102',
				serialNumber_21Att_2: '1111102103',
				date: '111年11月02日',
				zipCode: '104',
				district: '中山區',
				caseReportTotal: '0',
				ACTotal_Obs: '0',
				ACTotal_Reg: '0',
				facTotal_Obs: '0',
				facTotal_Reg: '0',
				info1_21Att: '無',
				info2_21Att: '無',
				caseReportImg: '', 
				caseReportImg_neo1: '',
				caseReportImg_neo2: '',
				caseReportImg_neo3: ''
			},
		};
	},
	computed: { },
	watch: {},
	created() {	
		this.schemasOri = {};

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
	mounted() {},
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
						if(Object.keys(this.list.content).length != 0) {
							this.inputs = this.list.content.inputs;

							// NOTE: 將image轉成dataURI (不然pdfme generate會報錯)
							for(const key in this.inputs) {
								if(key.includes('Img') && this.inputs[key].length != 0) {
									await fetch(this.inputs[key])
										.then(res => res.blob())
										.then(blob => {
											const reader = new FileReader();
											reader.onloadend = () => { this.inputs[key] = reader.result };
											reader.readAsDataURL(blob);
										})
								}
							}
							
							this.initPage = initPage != 0 ? initPage : this.list.content.initPage;
						}
						this.reportDate = this.list.reportDate;
						this.checkDate = this.list.checkDate ? this.list.checkDate : this.list.reportDate;
						this.inputs.zipCode = String(this.list.zipCode);

						await this.initPDF();
					}
					resolve();
					this.loading = false;
				}).catch(err => { this.loading = false; });
			})
		},
		async initPDF() {
			return new Promise(resolve => {
				fetch(`/assets/pdf/daily/PI2_1-Att.json?t=${Date.now()}`).then(async (response) => {
					const domContainer = this.$refs.container.$el;
					this.template = await response.json();

					const font = {
						edukai: {
							data: await fetch('/assets/font/edukai-4.0.ttf').then(res => res.arrayBuffer()),
							fallback: true
						},
						// NotoSansTC: {
						// 	data: await fetch('/assets/font/NotoSansTC-Regular.ttf').then(res => res.arrayBuffer()),
						// 	fallback: true
						// }
					};

					const changeInput = (arg) => {
						if(['caseReportTotal', 'ACTotal_Obs', 'ACTotal_Reg', 'facTotal_Obs', 'facTotal_Reg'].includes(arg.key)) this.inputForm[arg.key] = parseInt(arg.value);
						if(['caseReportImg', 'caseReportImg_neo1', 'caseReportImg_neo2','caseReportImg_neo3'].includes(arg.key)) {
							// console.log(arg);
							if(this.schemasOri[arg.key]) {
								this.template.schemas[0][arg.key] = JSON.parse(JSON.stringify(this.schemasOri[arg.key]));
								delete this.schemasOri[arg.key];
								this.form.updateTemplate(this.template);
							}

							this.inputs[arg.key] = arg.value;

							const img = new Image();
							img.onload = () => {
								// console.log(img.width, img.height);
								const templateWidth = this.template.schemas[0][arg.key].width;
								const templateHeight = this.template.schemas[0][arg.key].height;
								const ratio = Math.min(templateWidth / img.width, templateHeight / img.height);
								// console.log(ratio);

								this.schemasOri[arg.key] = JSON.parse(JSON.stringify(this.template.schemas[0][arg.key]));
								this.template.schemas[0][arg.key].position.x = this.template.schemas[0][arg.key].position.x + (this.template.schemas[0][arg.key].width - img.width * ratio) / 2;
								this.template.schemas[0][arg.key].position.y = this.template.schemas[0][arg.key].position.y + (this.template.schemas[0][arg.key].height - img.height * ratio) / 2;
								this.template.schemas[0][arg.key].width = img.width * ratio;
								this.template.schemas[0][arg.key].height = img.height * ratio;
								this.form.updateTemplate(this.template);
							}
							img.src = arg.value;
						}
					}

					this.form = new Form({ domContainer, template: this.template, inputs: [ this.inputs ], options: { font } });
					this.form.onChangeInput(arg => changeInput(arg));

					for(const [key, value] of Object.entries(this.inputs)) changeInput({ key, value });
					if(Object.keys(this.list.content).length == 0) this.getList();
					else this.setPDFinputs();
					
					resolve();
				})
			})
		},
		setPDFinputs() {
			//工程名稱
			const reportDate = moment(this.reportDate).subtract(1911, 'year');
			this.inputs.district = this.districtList[this.inputs.zipCode].name;
			this.inputs.contractName = this.districtList[this.inputs.zipCode].tenderName;
			//紀錄編號
			for(let i=0; i < this.template.schemas.length; i++) {
				this.inputs[`serialNumber_21Att_${i+1}`] = reportDate.format("YYYYMMDD01").slice(1) + String(i+this.initPage).padStart(2, '0');
			}
			//檢查日期
			const checkDate = moment(this.checkDate).subtract(1911, 'year');
			this.inputs.date = checkDate.format("YYYY年MM月DD日").slice(1);
			//資料數轉換
			let sum = 0
			for(const key of [ 'ACTotal_Obs', 'ACTotal_Reg', 'facTotal_Obs', 'facTotal_Reg' ]) {
				this.inputs[key] = String(this.inputForm[key]);
				//本日通報 加總
				sum += Number(this.inputForm[key]);
			}
			this.inputs.caseReportTotal = String(sum);

			for(const key of [ 'caseReportImg', 'caseReportImg_neo1', 'caseReportImg_neo2', 'caseReportImg_neo3' ]) {
				if(this.inputForm[key]) this.inputs[key] = this.inputForm[key];
			}

			this.form.setInputs([this.inputs]);
			this.form.render();
		},
		getList() {
			this.loading = true;
			const date = moment(this.reportDate).format("YYYY-MM-DD");

			getCaseCount({
				zipCode: Number(this.inputs.zipCode),
				timeStart: date,
				timeEnd: moment(date).add(1, "d").format("YYYY-MM-DD")
			}).then(response => {
				this.inputForm.caseReportTotal = Number(response.data.result.caseTotal_report);
				this.inputForm.ACTotal_Obs = Number(response.data.result.ACTotal_Obs);
				this.inputForm.ACTotal_Reg = Number(response.data.result.ACTotal_Reg);
				this.inputForm.facTotal_Obs = Number(response.data.result.facTotal_Obs);
				this.inputForm.facTotal_Reg = Number(response.data.result.facTotal_Reg);

				this.setPDFinputs();
				this.loading = false;
			}).catch(err => this.loading = false);
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

			setPerfContent(this.listQuery.perfContentId, {
				checkDate: moment(this.checkDate).format("YYYY-MM-DD"),
				pageCount: 1,
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

				const filename = "PI2-1附件.pdf"; 
				const file = new File([blob], filename, { type: 'application/pdf' });
				const link = document.createElement('a');
				const url = URL.createObjectURL(file);
				link.href = url;
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
						path: "/PIReport/daily/edit",
						query: { reportId: this.listQuery.reportId }
					})
					break;
				case -1:
					this.$router.push({
						path: "/PIReport/daily/PI2_1",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[0], cidList: this.$route.query.cidList }
					})
					break;
				case 1:
					this.$router.push({
						path: "/PIReport/daily/PI2_1_Att_2",
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
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.PI2_1-Att_1
	.filter-container 
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
</style>