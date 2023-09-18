<template>
	<div class="app-container PI3_2" v-loading="loading">
		<h2>PI3.2</h2>

		<el-button v-if="pageTurn[0] != -1" icon="el-icon-arrow-left" size="mini" plain :disabled="pageTurn[0] == -1" @click="handlePageTurn(-1)">PI2.1附件-3</el-button>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn()">週報表</el-button>
		<span> > </span>
		<el-button type="text" size="mini" style="margin: 0 5px" @click="handlePageTurn(0)">{{ districtList[inputs.zipCode].name }} ({{ formatDate(reportDate) }})</el-button>
		<el-button v-if="pageTurn[1] != -1" type="primary" icon="el-icon-arrow-right" size="mini" plain :disabled="pageTurn[1] == -1"  @click="handlePageTurn(1)">PI3.2附件</el-button>

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
						
						<h4>案件數據</h4>
						<el-form-item label="廠商當週所有維護案件數" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.maintainAll_Num32" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<!-- <el-divider /> -->
						<!-- <el-form-item label="接獲通報案件於1小時內到達現場且回報修復情形案件數" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.Hr1_Num32" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="4小時內完成臨補或設置安全措施案件數" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.Hr4_Num32" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item> -->
						<el-divider content-position="left">查報次日起15日內(含例假日)修復完成案件數</el-divider>
						<el-form-item label="坑洞" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.Day15_Num32_hole" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-form-item label="其他AC類型" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.Day15_Num32_AC" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-divider content-position="left">查報次日起45日內(含例假日)修復完成案件數</el-divider>
						<el-form-item label="人行道(含附屬設施)" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.Day45_Num32_FA" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<!-- <el-form-item label="標線復原案件於修復完成後2日內(含例假日)將標線復原案件數" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.Day2_Num32" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-divider /> -->
						<el-form-item label="未滿足契約時間要求案件資訊" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.failTime_Num32" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-divider />
						<!-- <el-form-item label="廠商自主檢查人次數" :label-width="labelWidth1">
							<el-input-number v-model="inputForm.companyCheck_Num32" controls-position="right" :min="0" @change="setPDFinputs" />
						</el-form-item>
						<el-divider /> -->
						
						<h4>應檢附文件</h4>
						<el-form-item label="" :label-width="labelWidth2">
							<el-checkbox v-model="inputForm.checkInTime_doc32" @change="setPDFinputs">滿足與未滿足各項契約時間要求資訊</el-checkbox>
							<br/>
							<el-checkbox v-model="inputForm.checkCoFail_doc32" @change="setPDFinputs">廠商自主發現未滿足契約要求案件資訊</el-checkbox>
							<br/>
							<el-checkbox v-model="inputForm.checkSandOFail_doc32" @change="setPDFinputs">機關或監造抽查檢核後發現未滿足要求的案件數資訊</el-checkbox>
							<br/>
							<el-checkbox v-model="inputForm.checkCoUnreason_doc32" @change="setPDFinputs">廠商認為為滿足判定不合理資訊</el-checkbox>
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
import { getCaseWarrantyCount, getPerfContent, setPerfContent } from "@/api/PI";

export default {
	name: "PI3_2",
	components: { },
	data() {
		return {
			labelWidth1:'150px',
			labelWidth2:'20px',
			loading: true,
			initPage: 4,
			listQuery: {
				reportId: 0,
				perfContentId: null
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
				maintainAll_Num32:0,
				// Hr1_Num32: 0,
				// Hr4_Num32: 0,
				Day15_Num32_hole: 0,
				Day15_Num32_AC: 0,
				Day45_Num32_FA: 0,
				// Day2_Num32:0,
				failTime_Num32: 0,
				// companyCheck_Num32: 0,
				checkInTime_doc32: true,
				checkCoFail_doc32: true,
				checkSandOFail_doc32: true,
				checkCoUnreason_doc32: true,
			},
			inputs: {
				contractName: '111年度中山區道路巡查維護修繕成效式契約',//工程名稱
				serialNumber: '11206250201',//紀錄編號
				companyName: '聖東營造股份有限公司',//施工廠商
				date: '',//檢查日期
				zipCode: '104',
				requiredStandard_32:'維護工作執行期限應滿足契約要求',//要求標準
				measurement_32:'廠商當週於規定時間內完成維護工作之案件數/ 廠商當週所有維護案件數',//量測方式
				maintainAll_Num32: '0',//A
				Hr1_Num32: '0',
				Hr4_Num32: '0',
				Day15_Num32_hole: '0',
				Day15_Num32_AC: '0',
				Day45_Num32_FA: '0',
				Day2_Num32:'0',
				sumCompleteMaintain_Num32:'0',
				failTime_Num32: '0',//C
				companyCheck_Num32: '0',
				BCA_32:'',
				checkInTime_doc32:'V',
				checkCoFail_doc32:'V',
				checkSandOFail_doc32:'V',
				checkCoUnreason_doc32:'V',
			},
		};
	},
	computed: { },
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
		} else this.$router.push({ path: "/PIReport/weekly/list" });	
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
				fetch(`/assets/pdf/weekly/PI3_2-Main.json?t=${Date.now()}`).then(async (response) => {
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
						if(['checkInTime_doc32','checkCoFail_doc32','checkSandOFail_doc32','checkCoUnreason_doc32'].includes(arg.key)) this.inputForm[arg.key] = (arg.value == 'V' || arg.value == 'v');
						if(['maintainAll_Num32', 'Hr1_Num32', 'Hr4_Num32', 'Day15_Num32_hole', 'Day15_Num32_AC', 'Day45_Num32_FA', 'Day2_Num32', 'failTime_Num32', 'companyCheck_Num32'].includes(arg.key)) this.inputForm[arg.key] = parseInt(arg.value);
						this.setPDFinputs();
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
			// console.log('setPDFinputs');
			//工程名稱
			const reportDate = moment(this.reportDate).subtract(1911, 'year');
			this.inputs.contractName = this.districtList[this.inputs.zipCode].tenderName;
			//紀錄編號
			this.inputs.serialNumber = reportDate.format("YYYYMMDD02").slice(1) + String(this.initPage).padStart(2, '0');	
			//檢查日期
			const checkDate = moment(this.checkDate).subtract(1911, 'year');
			this.inputs.date = checkDate.format("YYYY年MM月DD日").slice(1);
			//案件數
			this.inputForm.Hr1_Num32 = this.inputForm.Hr4_Num32 = this.inputForm.Day15_Num32 = this.inputForm.Day45_Num32 = this.inputForm.Day2_Num32 = this.inputForm.sumCompleteMaintain_Num32 = this.inputForm.companyCheck_Num32 = this.inputForm.maintainAll_Num32;
			for(const key of [ 'maintainAll_Num32', 'Hr1_Num32', 'Hr4_Num32', 'Day15_Num32_hole', 'Day15_Num32_AC', 'Day45_Num32_FA', 'Day2_Num32', 'sumCompleteMaintain_Num32', 'failTime_Num32', 'companyCheck_Num32']) this.inputs[key] = String(this.inputForm[key]);

			//計算指標數值
			const A = this.inputForm.maintainAll_Num32;
			const B = this.inputForm.sumCompleteMaintain_Num32;
			const C = this.inputForm.failTime_Num32;
			if(A==0) this.inputs.BCA_32='';
			else this.inputs.BCA_32 = String( Math.round(((B-C)/A)*10000) / 100);

			//應檢附文件
			for(const key of ['checkInTime_doc32','checkCoFail_doc32','checkSandOFail_doc32','checkCoUnreason_doc32']) this.inputs[key] = this.inputForm[key] ? 'V' : '';
			this.form.setInputs([this.inputs]);
			this.form.render();
		},
		getList() {
			this.loading = true;
			this.inputForm.maintainAll_Num32 = 0;

			let timeStart = moment(this.reportDate).day() == 0 
				? moment(this.reportDate).day(-6).format("YYYY-MM-DD") 
				: moment(this.reportDate).day(1).format("YYYY-MM-DD");
			if(moment(timeStart).month() != moment(this.reportDate).month()) timeStart = moment(this.reportDate).startOf('month').format("YYYY-MM-DD");
			const timeEnd = moment(this.reportDate).add(1, "d").format("YYYY-MM-DD");

			getCaseWarrantyCount({
				zipCode: Number(this.inputs.zipCode),
				timeStart,
				timeEnd
			}).then(response => {
				this.inputForm.maintainAll_Num32 = Number(response.data.result.caseTotal);
				this.inputForm.Day15_Num32_hole = Number(response.data.result.caseTotal_hole_AC);
				this.inputForm.Day15_Num32_AC = Number(response.data.result.caseTotal_other_AC);
				this.inputForm.Day45_Num32_FA = Number(response.data.result.caseTotal_sidewalk_FA);

				this.setPDFinputs();
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		storeData(){
			this.loading = true;
			const storedContent = {
				initPage: this.initPage,
				inputs: this.inputs
			}
			setPerfContent(this.listQuery.perfContentId, {
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
			// console.log(this.form);
			generate({ template: this.form.getTemplate(), inputs: this.form.getInputs(), options: { font: this.form.getFont() } }).then((pdf) => {
				// console.log(pdf);
				const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
				// window.open(URL.createObjectURL(blob));

				const filename = "PI3-2.pdf"; 
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
					this.$router.push({
						path: "/PIReport/weekly/PI2_2_Att_3",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[0], cidList: this.$route.query.cidList }
					})
					return;
				case 1:
					this.$router.push({
						path: "/PIReport/weekly/PI3_2_Att_1",
						query: { reportId: this.listQuery.reportId, contentId: this.pageTurn[1], cidList: this.$route.query.cidList }
					})
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
</style>