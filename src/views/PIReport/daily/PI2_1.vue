<template>
	<div class="app-container PI2_1" v-loading="loading">
		<h2>PI2.1</h2>

		<el-button v-if="pageTurn[0] != -1" icon="el-icon-arrow-left" size="mini" plain :disabled="pageTurn[0] == -1" @click="handlePageTurn(-1)" />
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn()">日報表</el-button>
		<span> > </span>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn(0)">{{ districtList[inputs.zipCode].name }} ({{ formatDate(reportDate) }})</el-button>
		<el-button v-if="pageTurn[1] != -1" type="primary" icon="el-icon-arrow-right" size="mini" plain :disabled="pageTurn[1] == -1"  @click="handlePageTurn(1)">PI2.1附件</el-button>
		
		<el-row :gutter="24">
			<el-col :span="11">
				<el-card shadow="never" style="width: 480px; margin: 20px auto; padding: 5px 10px;">
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
						<h4>所有通報數</h4>
						<el-form-item label="被通報案件數" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.informed_Num21" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="廠商通報數(查報數)" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.companyInform_Num21" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="不合理案件數" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.unreasonable_Num21" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-divider />
						<el-form-item label="未登入或登入不完整案件數" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.incomplete_Num21" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-divider />
						<h4>應檢附文件</h4>
						<el-form-item label="" :label-width="labelWidth2">
							<el-checkbox v-model="inputForm.checkCo_dailyInform21" @change="setPDFinputs">廠商每天通報資訊(巡查日誌)</el-checkbox>
							<br/>
							<el-checkbox v-model="inputForm.checkCo_dailyLogin21" @change="setPDFinputs">廠商於系統每天登錄資料數量資訊(道管系統案件處理+觀察案件)</el-checkbox>
							<br/>
							<el-checkbox v-model="inputForm.checkPeriod_Complete21" @change="setPDFinputs">期間有完成巡查工作但未登錄之資訊</el-checkbox>
							<br/>
							<el-checkbox v-model="inputForm.checkPeriod_IncompleteLogin21" @change="setPDFinputs">期間系統資料登錄不完整案件資訊</el-checkbox>
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
import { getCaseCount, getPerfContent, setPerfContent } from "@/api/PI";

export default {
	name: "PI2_1",
	components: { },
	data() {
		return {
			labelWidth1:'150px',
			labelWidth2:'20px',
			loading: true,
			initPage: 1,
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
				informed_Num21: 0,
				companyInform_Num21: 0,
				unreasonable_Num21: 0,
				incomplete_Num21: 0,
				checkCo_dailyInform21:true,
				checkCo_dailyLogin21:true,
				checkPeriod_Complete21:true,
				checkPeriod_IncompleteLogin21:true,
			},
			inputs: {
				contractName: '111年度中山區道路巡查維護修繕成效式契約',//工程名稱
				serialNumber_21Main: '1111102101',//紀錄編號
				companyName: '聖東營造股份有限公司',//施工廠商
				date: '',//檢查日期
				zipCode: '104',
				district: '中山區',
				requiredStandard_21:'完成巡查工作後必須及時登錄資料',//要求標準
				measurement_21:'廠商於系統當天登錄資料數量/廠商當天通報數',//量測方式
				sumInform_Num21: '0',//A
				informed_Num21: '0',//B
				companyInform_Num21: '0',//C
				unreasonable_Num21: '0',//D
				roadSystem_Num21:'0',//E
				incomplete_Num21: '0',//F
				companyCheck_Num21: '0',
				EFA_21:'',
				checkCo_dailyInform21: 'V',
				checkCo_dailyLogin21: 'V',
				checkPeriod_Complete21: 'V',
				checkPeriod_IncompleteLogin21: 'V',
			}
		};
	},
	computed: {},
	watch: {},
	async created() {	
		if(this.$route.query.reportId && this.$route.query.contentId) {
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
				fetch(`/assets/pdf/daily/PI2_1-Main.json?t=${Date.now()}`).then(async (response) => {
					const domContainer = this.$refs.container.$el;
					this.template = await response.json();

					const font = {
						edukai: {
							data: await fetch('/assets/font/edukai-4.0.ttf').then(res => res.arrayBuffer()),
							fallback: true
						}
					};

					const changeInput = (arg) => {
						// console.log(arg);
						if([ 'checkCo_dailyInform21','checkCo_dailyLogin21','checkPeriod_Complete21','checkPeriod_IncompleteLogin21'].includes(arg.key)) this.inputForm[arg.key] = (arg.value == 'V' || arg.value == 'v');
						if([ 'informed_Num21', 'companyInform_Num21', 'unreasonable_Num21', 'incomplete_Num21', 'companyCheck_Num21'].includes(arg.key)) this.inputForm[arg.key] = parseInt(arg.value);
						if(['failReason'].includes(arg.key)) this.inputForm[arg.key] = arg.value;
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
			const reportDate = moment(this.reportDate).format("YYYY/MM/DD").split("/");
			reportDate[0] = Number(reportDate[0]) - 1911;
			this.inputs.district = this.districtList[this.inputs.zipCode].name;
			this.inputs.contractName = this.districtList[this.inputs.zipCode].tenderName;
			//紀錄編號
			this.inputs.serialNumber_21Main = reportDate.join("") + "01" + String(this.initPage).padStart(2, '0');	
			//檢查日期
			const checkDate = moment(this.checkDate).format("YYYY/MM/DD").split("/");
			checkDate[0] = Number(checkDate[0]) - 1911;
			this.inputs.date = `${checkDate[0]}年${checkDate[1]}月${checkDate[2]}日`;
			//查核人次數(資料轉換)
			for(const key of [
				'informed_Num21',
				'companyInform_Num21',
				'unreasonable_Num21',
				'incomplete_Num21']) {
				this.inputs[key] = String(this.inputForm[key]);
			}
			//廠商自主檢查件數 = 廠商通報數(C)
			this.inputs.companyCheck_Num21 = String(this.inputForm.companyInform_Num21)
			
			//計算指標數值(A=E)
			const A = this.inputForm.informed_Num21+this.inputForm.companyInform_Num21;
			const E = this.inputForm.roadSystem_Num21 = this.inputForm.informed_Num21+this.inputForm.companyInform_Num21
			const F = this.inputForm.incomplete_Num21;
			if(A==0){
				this.inputs.EFA_21=''
			}else{
				this.inputs.EFA_21 = String( Math.round(((E-F)/A)*10000) / 100)
			}
			//計算所有通報數(A) && (E)=(A)
			this.inputs.sumInform_Num21 = String(A);
			this.inputs.roadSystem_Num21 = String(A);
			//應檢附文件
			for(const key of ['checkCo_dailyInform21','checkCo_dailyLogin21','checkPeriod_Complete21','checkPeriod_IncompleteLogin21']){
				this.inputs[key] = this.inputForm[key] ? 'V' : '';
			}

			this.form.setInputs([this.inputs]);
			this.form.render();
		},
		getList() {
			this.loading = true;
			const date = moment(this.reportDate).format("YYYY-MM-DD");
			this.inputForm.companyInform_Num21 = 0;
			this.inputForm.unreasonable_Num21 = 0;

			getCaseCount({
				zipCode: Number(this.inputs.zipCode),
				timeStart: date,
				timeEnd: moment(date).add(1, "d").format("YYYY-MM-DD")
			}).then(response => {
				this.inputForm.informed_Num21 = Number(response.data.result.caseTotal_inform);
				this.inputForm.companyInform_Num21 = Number(response.data.result.caseTotal_report);
				this.inputForm.unreasonable_Num21 = Number(response.data.result.caseTotal_unreasonable);

				this.setPDFinputs();
				this.loading = false;
			}).catch(err => this.loading = false);
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
			uploadForm.append('pageCount', 1);
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
				generate({ template: this.form.getTemplate(), inputs: this.form.getInputs(), options: { font: this.form.getFont() } }).then((pdf) => {
					resolve(pdf);
				});
			});
		},
		handleDownload() {
			generate({ template: this.form.getTemplate(), inputs: this.form.getInputs(), options: { font: this.form.getFont() } }).then((pdf) => {
				const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
				// window.open(URL.createObjectURL(blob));

				const filename = "PI2-1.pdf"; 
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
					break;
				case 1:
					this.$router.push({
						path: "/PIReport/daily/PI2_1_Att_1",
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
			return moment(date).isValid() ? moment(date).format('YYYY-MM-DD') : "-";
		}
	}
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.el-checkbox
	overflow-wrap: normal
.PI2_1
	position: relative
	.filter-container 
		.filter-item
			margin-right: 5px
</style>