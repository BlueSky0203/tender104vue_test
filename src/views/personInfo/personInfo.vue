<template>
	<div class="app-container">
		<h2>人事資料表</h2>
		<el-row :gutter="24">
			<el-col :span="11">
				<el-card shadow="never" style="width: 480px; margin: 20px auto; padding: 5px 10px;">
					<el-form :model="inputForm">
						<div style="display:flex;justify-content:space-between;align-items: center">
							<h3>檢核資訊</h3>
							<el-button type="primary" plain icon="el-icon-document" size="small" @click="handleDownload()">輸出</el-button>
						</div>
						
						<el-collapse v-model="activeNames">
							<el-collapse-item title="資料表格" name="1">
								<el-form-item label="部門" :label-width="labelWidth1">
									<el-input v-model="inputForm.department" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="職位" :label-width="labelWidth1">
									<el-input v-model="inputForm.position" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="到職日期" :label-width="labelWidth1">
									<el-date-picker
										v-model="startDate"
										type="date"
										placeholder="日期"
										:picker-options="pickerOptions"
										:clearable="false"
										style="width: 200px"
										@change="setPDFinputs"
									/>
								</el-form-item>
							</el-collapse-item>

							<el-collapse-item title="基本資料" name="2">
								<el-form-item label="姓名" :label-width="labelWidth1">
									<el-input v-model="inputForm.name" @change="setPDFinputs" />
								</el-form-item>
								<el-row>
									<el-col :span="14">
										<el-form-item label="性別" :label-width="labelWidth1">
											<el-input v-model="inputForm.sex" @change="setPDFinputs" />
										</el-form-item>
									</el-col>
									<el-col :span="10">
										<el-form-item label="年齡" :label-width="labelWidth3">
											<el-input v-model="inputForm.age" @change="setPDFinputs" />
										</el-form-item>
									</el-col>
								</el-row>
								
								<el-form-item label="出生年月日" :label-width="labelWidth1">
									<el-date-picker
										v-model="birthDate"
										type="date"
										placeholder="日期"
										:picker-options="pickerOptions"
										:clearable="false"
										style="width: 200px"
										@change="setPDFinputs"
									/>
								</el-form-item>
								
								<el-form-item label="身分證字號" :label-width="labelWidth1">
									<el-input v-model="inputForm.id" @change="setPDFinputs" />
								</el-form-item>

								<el-form-item label="婚姻狀況" :label-width="labelWidth1">
									<el-radio-group v-model="inputForm.check_married" @change="setPDFinputs">
										<!-- <el-radio v-model="radio1" :label="1" @change="handleRadioChange(1)">未婚</el-radio>
										<el-radio v-model="radio1" :label="2" @change="handleRadioChange(2)">已婚</el-radio> -->
										<el-radio :label="1">未婚</el-radio>
										<el-radio :label="2">已婚</el-radio>
									</el-radio-group>
								</el-form-item>

								<br/>
								<el-form-item label="連絡電話 (住家)" :label-width="labelWidth1">
									<el-input v-model="inputForm.homePhone" @change="setPDFinputs" />
								</el-form-item>

								<el-row>
									<el-col :span="14">
										<el-form-item label="身高" :label-width="labelWidth1">
											<el-input v-model="inputForm.height" @change="setPDFinputs" />
										</el-form-item>
									</el-col>
									<el-col :span="10">
										<el-form-item label="體重" :label-width="labelWidth3">
											<el-input v-model="inputForm.weight" @change="setPDFinputs" />
										</el-form-item>
									</el-col>
								</el-row>

								<el-form-item label="連絡電話 (手機)" :label-width="labelWidth1">
									<el-input v-model="inputForm.phone" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="E-mail" :label-width="labelWidth1">
									<el-input v-model="inputForm.mail" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="戶籍地址" :label-width="labelWidth1">
									<el-input v-model="inputForm.address1" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="居住地址" :label-width="labelWidth1">
									<el-input v-model="inputForm.address2" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="緊急聯絡人姓名" :label-width="labelWidth1">
									<el-input v-model="inputForm.emergencyContactName" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="緊急聯絡人關係" :label-width="labelWidth1">
									<el-input v-model="inputForm.emergencyContactRelationship" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="緊急聯絡人電話" :label-width="labelWidth1">
									<el-input v-model="inputForm.emergencyContactPhone" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="緊急聯絡人地址" :label-width="labelWidth1">
									<el-input v-model="inputForm.emergencyContactAddress" @change="setPDFinputs" />
								</el-form-item>
							</el-collapse-item>

							<el-collapse-item title="學歷與經歷" name="3">
								<el-form-item label="學校名稱" :label-width="labelWidth1">
									<el-input v-model="inputForm.school" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="科系" :label-width="labelWidth1">
									<el-input v-model="inputForm.major" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="在學期間" :label-width="labelWidth1">
									<el-form-item label="起始日期" >
										<el-date-picker
											v-model="academicTermStart"
											type="date"
											placeholder="日期"
											:picker-options="pickerOptions"
											:clearable="false"
											style="width: 200px"
											@change="setPDFinputs"
										/>
									</el-form-item>
									<el-form-item label="結束日期" class="form-date-css">
										<el-date-picker
											v-model="academicTermEnd"
											type="date"
											placeholder="日期"
											:picker-options="pickerOptions"
											:clearable="false"
											style="width: 200px"
											@change="setPDFinputs"
										/>
									</el-form-item>
								</el-form-item>

								<el-form-item label="畢業狀況" :label-width="labelWidth1">
									<el-radio-group v-model="inputForm.check_graduated" @change="setPDFinputs">
										<!-- <el-radio v-model="radio2" :label="3" @change="handleRadioChange(3)">畢業</el-radio>
										<el-radio v-model="radio2" :label="4" @change="handleRadioChange(4)">肄業</el-radio> -->
										<el-radio :label="1">畢業</el-radio>
										<el-radio :label="2">肄業</el-radio>
									</el-radio-group>
								</el-form-item>

								<br/>
								<el-form-item label="公司名稱1" :label-width="labelWidth1">
									<el-input v-model="inputForm.companyName1" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="職位1" :label-width="labelWidth1">
									<el-input v-model="inputForm.position1" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="在職期間(年資)1" :label-width="labelWidth1">
									<el-form-item label="起始日期" >
										<el-date-picker
											v-model="employmentTermStart1"
											type="date"
											placeholder="日期"
											:picker-options="pickerOptions"
											:clearable="false"
											style="width: 200px"
											@change="setPDFinputs"
										/>
									</el-form-item>
									<el-form-item label="結束日期" class="form-date-css">
										<el-date-picker
											v-model="employmentTermEnd1"
											type="date"
											placeholder="日期"
											:picker-options="pickerOptions"
											:clearable="false"
											style="width: 200px"
											@change="setPDFinputs"
										/>
									</el-form-item>
								</el-form-item>
								<el-form-item label="離職原因1" :label-width="labelWidth1">
									<el-input v-model="inputForm.reason1" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="公司名稱2" :label-width="labelWidth1">
									<el-input v-model="inputForm.companyName2" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="職位2" :label-width="labelWidth1">
									<el-input v-model="inputForm.position2" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="在職期間(年資)2" :label-width="labelWidth1">
									<el-form-item label="起始日期" >
										<el-date-picker
											v-model="employmentTermStart2"
											type="date"
											placeholder="日期"
											:picker-options="pickerOptions"
											:clearable="false"
											style="width: 200px"
											@change="setPDFinputs"
										/>
									</el-form-item>
									<el-form-item label="結束日期" class="form-date-css">
										<el-date-picker
											v-model="employmentTermEnd2"
											type="date"
											placeholder="日期"
											:picker-options="pickerOptions"
											:clearable="false"
											style="width: 200px"
											@change="setPDFinputs"
										/>
									</el-form-item>
								</el-form-item>
								<el-form-item label="離職原因2" :label-width="labelWidth1">
									<el-input v-model="inputForm.reason2" @change="setPDFinputs" />
								</el-form-item>
							</el-collapse-item>

							<el-collapse-item title="工作技能" name="4">
								<h5>電腦文書軟體</h5>
								<el-form-item label="" :label-width="labelWidth2">
									<el-checkbox v-model="inputForm.check_word" @change="setPDFinputs">Word</el-checkbox>
									<el-checkbox v-model="inputForm.check_excel" @change="setPDFinputs">Excel</el-checkbox>
									<el-checkbox v-model="inputForm.check_powerPoint" @change="setPDFinputs">PowerPoint</el-checkbox>
									
									<el-row :gutter="10">
										<el-col :span="4">
											<el-checkbox v-model="inputForm.check_otherSkill" @change="setPDFinputs">其他</el-checkbox>
										</el-col>
										<el-col :span="20">
											<el-input v-model="inputForm.skill" @change="setPDFinputs" />
										</el-col>
									</el-row>

									<br/>
								</el-form-item>
								<h5>駕駛執照</h5>
								<el-form-item label="" :label-width="labelWidth2">
									<el-checkbox v-model="inputForm.check_motor" @change="setPDFinputs">機車</el-checkbox>
									<el-checkbox v-model="inputForm.check_car" @change="setPDFinputs">汽車</el-checkbox>
									<el-checkbox v-model="inputForm.check_taxi" @change="setPDFinputs">職業小客車</el-checkbox>
									<el-checkbox v-model="inputForm.check_truck" @change="setPDFinputs">大貨車</el-checkbox>

									<el-row :gutter="10">
										<el-col :span="4">
											<el-checkbox v-model="inputForm.check_otherDriverLicense" @change="setPDFinputs">其他</el-checkbox>
										</el-col>
										<el-col :span="20">
											<el-input v-model="inputForm.driverLicense" @change="setPDFinputs" />
										</el-col>
									</el-row>

									<br/>
								</el-form-item>
								<h5>專業證照</h5>
								<el-form-item label="證照1" :label-width="labelWidth1">
									<el-input v-model="inputForm.license1" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="核發單位1" :label-width="labelWidth1">
									<el-input v-model="inputForm.institution1" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="發照日期1" :label-width="labelWidth1">
									<el-date-picker
										v-model="issuedDate1"
										type="date"
										placeholder="日期"
										:picker-options="pickerOptions"
										:clearable="false"
										style="width: 200px"
										@change="setPDFinputs"
									/>
								</el-form-item>
								<el-form-item label="證照2" :label-width="labelWidth1">
									<el-input v-model="inputForm.license2" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="核發單位2" :label-width="labelWidth1">
									<el-input v-model="inputForm.institution2" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="發照日期2" :label-width="labelWidth1">
									<el-date-picker
										v-model="issuedDate2"
										type="date"
										placeholder="日期"
										:picker-options="pickerOptions"
										:clearable="false"
										style="width: 200px"
										@change="setPDFinputs"
									/>
								</el-form-item>
								<el-form-item label="證照3" :label-width="labelWidth1">
									<el-input v-model="inputForm.license3" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="核發單位3" :label-width="labelWidth1">
									<el-input v-model="inputForm.institution3" @change="setPDFinputs" />
								</el-form-item>
								<el-form-item label="發照日期3" :label-width="labelWidth1">
									<el-date-picker
										v-model="issuedDate3"
										type="date"
										placeholder="日期"
										:picker-options="pickerOptions"
										:clearable="false"
										style="width: 200px"
										@change="setPDFinputs"
									/>
								</el-form-item>
							</el-collapse-item>
						</el-collapse>
						
					</el-form>
				</el-card>
			</el-col>
			<el-col :span="13" ref="container" />
		</el-row>
	</div>
</template>

<script>
import moment from "moment";
import { generate } from '@pdfme/generator';
import { Form } from '@pdfme/ui';

export default {
  name: 'personalInformation',
  components: { },
  data() {
    return {
      inputs: {},

			radio1: null,
			radio2: null,
			activeNames: '1',
			labelHeight: '15px',
			labelWidth1:'150px',
			labelWidth2:'20px',
			labelWidth3: '90px',
			loading: true,
			dateTimePickerVisible: false,
			pickerOptions: {
				firstDayOfWeek: 1,
			},
			startDate: moment().startOf("d"),
			birthDate: moment().startOf("d").subtract(1, "d"),
			academicTermStart: moment().startOf("d").subtract(1, "d"),
			academicTermEnd: moment().startOf("d").subtract(1, "d"),
			employmentTermStart1: moment().startOf("d").subtract(1, "d"),
			employmentTermEnd1: moment().startOf("d").subtract(1, "d"),
			employmentTermStart2: moment().startOf("d").subtract(1, "d"),
			employmentTermEnd2: moment().startOf("d").subtract(1, "d"),
			issuedDate1: moment().startOf("d").subtract(1, "d"),
			issuedDate2: moment().startOf("d").subtract(1, "d"),
			issuedDate3: moment().startOf("d").subtract(1, "d"),
			template: {},
			inputForm: {
				department: '資訊部',
				position: '',
				name: '',
				sex: '',
				age: '',
				id: '',
				check_married: false,
				homePhone: '',
				phone: '',
				height: '',
				weight: '',
				mail: '',
				address1: '',
				address2: '',
				emergencyContactName: '',
				emergencyContactRelationship: '',
				emergencyContactPhone: '',
				emergencyContactAddress: '',
				school: '',
				major: '',
				companyName1: '',
				companyName2: '',
				check_graduated: false,
				reason1: '',
				reason2: '',
				check_word: false,
				check_excel: false,
				check_powerPoint: false,
				check_otherSkill: false,
				skill: '',
				check_motor: false,
				check_car: false,
				check_taxi: false,
				check_truck: false,
				check_otherDriverLicense: false,
				driverLicense: '',
				license1: '',
				license2: '',
				license3: '',
				position1: '',
				position2: '',
				institution1: '',
				institution2: '',
				institution3: '',
				issuedDate1: '',
				issuedDate2: '',
				issuedDate3: ''
			},
			inputs: {
				department: '',
				position: '',
				name: '',
				sex: '',
				age: '',
				id: '',
				homePhone: '',
				phone: '',
				height: '',
				weight: '',
				mail: '',
				address1: '',
				address2: '',
				emergencyContactName: '',
				emergencyContactRelationship: '',
				emergencyContactPhone: '',
				emergencyContactAddress: '',
				school: '',
				major: '',
				companyName1: '',
				companyName2: '',
				reason1: '',
				reason2: '',
				skill: '',
				driverLicense: '',
				license1: '',
				license2: '',
				license3: '',
				position1: '',
				position2: '',
				institution1: '',
				institution2: '',
				institution3: '',
				issuedDate1: '',
				issuedDate2: '',
				issuedDate3: '',
				check_unmarried: '',
				check_married: '',
				check_graduated: '',
				check_ungraduated: '',
				check_word: '',
				check_excel: '',
				check_powerPoint: '',
				check_otherSkill: '',
				check_motor: '',
				check_car: '',
				check_taxi: '',
				check_truck: '',
				check_otherDriverLicense: ''
			},
    }
  },
  computed: { },
  watch: {},
  created() {},
  mounted() {
    this.initPDF(); 
  },
  methods: {
    initPDF() {
			fetch(`/assets/pdf/personInfo.json?t=${Date.now()}`).then(async (response) => {
				const domContainer = this.$refs.container.$el;
				this.template = await response.json();

				// 讀取中文字
				const font = {
					edukai: {
						data: await fetch('/assets/font/edukai-4.0.ttf').then(res => res.arrayBuffer()),
						fallback: true
					}
				};

				this.form = new Form({ domContainer, template: this.template, inputs: [ this.inputs ], options: { font } });
				this.setPDFinputs();
			})
		},
		setPDFinputs() {
			const inputsData = [
				'department',
				'position',
				'name',
				'sex',
				'age',
				'id',
				'homePhone',
				'phone',
				'height',
				'weight',
				'mail',
				'address1',
				'address2',
				'emergencyContactName',
				'emergencyContactRelationship',
				'emergencyContactPhone',
				'emergencyContactAddress',
				'school',
				'major',
				'companyName1',
				'companyName2',
				'reason1',
				'reason2',
				'skill',
				'driverLicense',
				'license1',
				'license2',
				'license3',
				'institution1',
				'position1',
				'position2',
				'institution2',
				'institution3',
			];

			for (const data of inputsData) {
				this.inputs[data] = this.inputForm[data];
			}
			
			const startDate = moment(this.startDate)
			const birthDate = moment(this.birthDate)
			const academicTermStart = moment(this.academicTermStart)
			const academicTermEnd = moment(this.academicTermEnd)
			const employmentTermStart1 = moment(this.employmentTermStart1)
			const employmentTermEnd1 = moment(this.employmentTermEnd1)
			const employmentTermStart2 = moment(this.employmentTermStart2)
			const employmentTermEnd2 = moment(this.employmentTermEnd2)
			const issuedDate1 = moment(this.issuedDate1)
			const issuedDate2 = moment(this.issuedDate2)
			const issuedDate3 = moment(this.issuedDate3)
			const dateData = {
				startDate, 
				birthDate, 
				issuedDate1,
				issuedDate2,
				issuedDate3
			};

			for (const i in dateData) {
				this.inputs[i] = String(dateData[i].format("YYYY年MM月DD日"));
			}

			const academicTerm = String(`${academicTermStart.format("YYYY年MM月DD日")}-${academicTermEnd.format("YYYY年MM月DD日")}`);
			this.inputs.academicTerm = academicTerm;
			const employmentTerm1 = String(`${employmentTermStart1.format("YYYY年MM月DD日")}-${employmentTermEnd1.format("YYYY年MM月DD日")}`);
			this.inputs.employmentTerm1 = employmentTerm1;
			const employmentTerm2 = String(`${employmentTermStart2.format("YYYY年MM月DD日")}-${employmentTermEnd2.format("YYYY年MM月DD日")}`);
			this.inputs.employmentTerm2 = employmentTerm2;

			if (this.inputForm.companyName1 === '') {
				this.inputs.employmentTerm1 = '';
				this.inputs.employmentTerm2 = '';
			} else if (this.inputForm.companyName2 === '') {
				this.inputs.employmentTerm2 = '';
			}

			if (this.inputForm.license1 === '') {
				this.inputs.issuedDate1 = '';
				this.inputs.issuedDate2 = '';
				this.inputs.issuedDate3 = '';
			} else if (this.inputForm.license2 === '') {
				this.inputs.issuedDate2 = '';
				this.inputs.issuedDate3 = '';
			} else if (this.inputForm.license3 === '') {
				this.inputs.issuedDate3 = '';
			}
			
			// checkBox
			const checkingData = [
				'check_word',
				'check_excel',
				'check_powerPoint',
				'check_otherSkill',
				'check_motor',
				'check_car',
				'check_taxi',
				'check_truck',
				'check_otherDriverLicense'
			];

			for (const data of checkingData) {
				this.inputs[data] = this.inputForm[data] ? 'V' : '';
			}

			if (this.inputForm.check_married === 1) {
				this.inputs.check_unmarried = 'V';
				this.inputs.check_married = '';
			} else if (this.inputForm.check_married === 2) {
				this.inputs.check_unmarried = '';
				this.inputs.check_married = 'V';
			}
			
			if (this.inputForm.check_graduated === 1) {
				this.inputs.check_graduated = 'V';
				this.inputs.check_ungraduated = '';
			} else if (this.inputForm.check_graduated === 2) {
				this.inputs.check_graduated = '';
				this.inputs.check_ungraduated = 'V';
			}

			this.form.setInputs([this.inputs]);
			this.form.render();
		},
		handleDownload() {
			// console.log(this.form);
			generate({ template: this.form.getTemplate(), inputs: this.form.getInputs(), options: { font: this.form.getFont() } }).then((pdf) => {
				// console.log(pdf);
				const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
				// window.open(URL.createObjectURL(blob));

				const filename = "personInfo.pdf"; 
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
  }
}
</script>

<style lang="sass">
	.form-date-css
		padding-top: 15px

	.el-collapse-item__header
		font-size: 1.17em
		font-weight: bold
</style>