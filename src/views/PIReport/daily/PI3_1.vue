<template>
	<div class="app-container PI3_1" v-loading="loading">
		<h2>PI3.1</h2>

		<el-button v-if="pageTurn[0] != -1" icon="el-icon-arrow-left" size="mini" plain :disabled="pageTurn[0] == -1" @click="handlePageTurn(-1)">PI2.1附件-2</el-button>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn()">日報表</el-button>
		<span> > </span>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn(0)">{{ districtList[inputs.zipCode].name }} ({{ formatDate(reportDate) }})</el-button>
		<el-button v-if="pageTurn[1] != -1" type="primary" icon="el-icon-arrow-right" size="mini" plain :disabled="pageTurn[1] == -1"  @click="handlePageTurn(1)">PI3.1附件</el-button>

		<el-row :gutter="24">
			<el-col :span="11">
				<el-card shadow="never" style="width: 450px; margin: 40px auto; padding: 5px 10px; ">
					<el-form :model="inputForm" >
						<div style="display:flex;justify-content:space-between;align-items: center">
							<h3>檢核資訊</h3>
							<el-button-group>
								<el-button type="primary" plain icon="el-icon-document" size="small" @click="handleDownload()">輸出</el-button>
								<!-- <el-button type="info" icon="el-icon-refresh" size="small" @click="getList()">刷新</el-button> -->
								<el-button class="filter-item" type="success" icon="el-icon-document" size="small" @click="storeData">儲存</el-button>
							</el-button-group>
						</div>
						<el-divider />
						<el-form-item label="起始頁碼" :label-width="labelWidth1">
							<el-input-number v-model="initPage"  :min="1" @change="setPDFinputs" />
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
						<el-form-item label="當日工作執行日報填寫人次數" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.dailyReport_Num31" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-divider />
						<el-form-item label="未滿足基本安全要求人數" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.unqualifiedSafety_Num31" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-divider />
						<h4>應檢附文件</h4>
						<el-form-item label="" :label-width="labelWidth2">
							<el-checkbox v-model="inputForm.checkCo_dailyInspectAll31" @change="setPDFinputs" >廠商每日完成自主檢查資訊</el-checkbox>
							<br/>
							<el-checkbox v-model="inputForm.checkCo_discoverUnSafety31" @change="setPDFinputs">廠商自主發現未滿足基本安全要求人次數資訊</el-checkbox>
							<br/>
							<el-checkbox v-model="inputForm.checkOr_discoverUnSafety31" @change="setPDFinputs">機關或監造於抽查檢核後發現為滿足基本安全要求人次數資訊</el-checkbox>
							<br/>
							<el-checkbox v-model="inputForm.checkCo_unreasonable31" @change="setPDFinputs">廠商認為查檢核發現未滿足不合理資訊</el-checkbox>
						</el-form-item>
					</el-form>
				</el-card>
			</el-col>
			<el-col :span="13" ref="container" class="container"/>
		</el-row>
	</div>
</template>

<script>
import moment from "moment";
import { generate } from '@pdfme/generator';
import { Form } from '@pdfme/ui';
import { getPerfContent, setPerfContent } from "@/api/PI";

export default {
	name: "PI3_1",
	components: { },
	data() {
		return {
			labelWidth1:'170px',
			labelWidth2:'10px',
			loading: true,
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
			initPage:4,
			listQuery: {
				reportId: 0,
				perfContentId: null
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
				dailyReport_Num31: 0,
				qualifiedSafety_Num31: 0,
				unqualifiedSafety_Num31: 0,
				companyCheck_Num31:0,
				BCA_31:0,
				checkCo_dailyInspectAll31:true,
				checkCo_discoverUnSafety31:true,
				checkOr_discoverUnSafety31:true,
				checkCo_unreasonable31:true
			},
			inputs: {
				contractName: '111年度中山區道路巡查維護修繕成效式契約',//工程名稱
				serialNumber_31: '1111102104',//紀錄編號
				companyName: '聖東營造股份有限公司',//施工廠商
				date: '',//檢查日期
				zipCode: '104',//行政區
				district: '中山區',
				requiredStandard_31:'廠商人員執行工作應滿足安全性要求',//要求標準
				measurement_31:'當天滿足要求人次數/當日工作執行日報填寫人數',//量測方式
				dailyReport_Num31: '0',//A
				qualifiedSafety_Num31: '0',//B
				unqualifiedSafety_Num31: '0',//C
				companyCheck_Num31:'0',
				BCA_31:'',
				checkCo_dailyInspectAll31: 'V',
				checkCo_discoverUnSafety31: 'V',
				checkOr_discoverUnSafety31: 'V',
				checkCo_unreasonable31: 'V'
			},
		};
	},
	computed: { },
	watch: {},
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
				}).then(async (response) => {
					if (response.data.list.length == 0) {
						this.$message({
							message: "查無資料",
							type: "error",
						});
					} else {
						this.list = response.data.list[0];
						if(Object.keys(this.list.content).length != 0) {
							this.inputs = this.list.content.inputs;
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
				fetch(`/assets/pdf/daily/PI3_1-Main.json?t=${Date.now()}`).then(async (response) => {
					const domContainer = this.$refs.container.$el;
					this.template = await response.json();

					const font = {
						edukai: {
							data: await fetch('/assets/font/edukai-4.0.ttf').then(res => res.arrayBuffer()),
							fallback: true
						},
					};

					const changeInput = (arg) => {
						if(['checkCo_dailyInspectAll31','checkCo_discoverUnSafety31','checkOr_discoverUnSafety31','checkCo_unreasonable31'].includes(arg.key)) this.inputForm[arg.key] = (arg.value == 'V' || arg.value == 'v');
						if(['dailyReport_Num31','qualifiedSafety_Num31','unqualifiedSafety_Num31','companyCheck_Num31'].includes(arg.key)) this.inputForm[arg.key] = parseInt(arg.value);
					}

					this.form = new Form({ domContainer, template: this.template, inputs: [ this.inputs ], options: { font } });
					this.form.onChangeInput(arg => changeInput(arg));
					for(const [key, value] of Object.entries(this.inputs)) changeInput({ key, value });
					this.setPDFinputs();

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
			this.inputs.serialNumber_31 = reportDate.format("YYYYMMDD01").slice(1) + String(this.initPage).padStart(2, '0');
			//檢查日期
			const checkDate = moment(this.checkDate).subtract(1911, 'year');
			this.inputs.date = checkDate.format("YYYY年MM月DD日").slice(1);
			//查核人次數
			for(const key of [ 'dailyReport_Num31', 'unqualifiedSafety_Num31']) this.inputs[key] = String(this.inputForm[key]);
			//計算當日工作執行日報填寫人次數(A) = 滿足安全性巡查人數(B) = 廠商自主檢查人次數
			this.inputs.qualifiedSafety_Num31 = String(this.inputForm.dailyReport_Num31);
			this.inputs.companyCheck_Num31 = String(this.inputForm.dailyReport_Num31);
			//計算指標數值
			const A = this.inputForm.dailyReport_Num31;
			const B = this.inputForm.qualifiedSafety_Num31 = this.inputForm.dailyReport_Num31;
			const C = this.inputForm.unqualifiedSafety_Num31;
			if(A==0){
				this.inputs.BCA_31 = ''
			}else{
				this.inputs.BCA_31 = String( Math.round(((B-C)/A)*10000) /100 );
			}
			//應檢附文件
			for(const key of ['checkCo_dailyInspectAll31','checkCo_discoverUnSafety31','checkOr_discoverUnSafety31','checkCo_unreasonable31']){
				this.inputs[key] = this.inputForm[key] ? 'V' : '';
			}
			
			this.form.setInputs([this.inputs]);
			this.form.render();
		},
		storeData(){
			this.loading = true;
			const storedContent = {
				initPage: this.initPage,
				inputs: this.inputs
			}
			setPerfContent(this.listQuery.perfContentId,{
				checkDate: moment(this.checkDate).format("YYYY-MM-DD"),
				pageCount: 1,
				content: JSON.stringify(storedContent)
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
			generate({ template: this.form.getTemplate(), inputs: this.form.getInputs(), options: { font: this.form.getFont() } }).then((pdf) => {
				const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
				// window.open(URL.createObjectURL(blob));

				const filename = "PI3-1.pdf"; 
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
						path: "/PIReport/daily/PI2_1_Att_2",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[0], cidList: this.$route.query.cidList }
					})
					break;
				case 1:
					this.$router.push({
						path: "/PIReport/daily/PI3_1_Att_1",
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
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.PI3_1
	position: relative
	.filter-container 
		.filter-item
			margin-right: 5px
</style>