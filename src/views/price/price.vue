<template>
  <div class="app-container job-ticket-manage" v-loading="loading">
    <h2>計價管理</h2>
    <div class="filter-container">
      <div class="filter-item">
        <div
          class="el-input el-input--medium el-input-group el-input-group--prepend"
        >
          <div class="el-input-group__prepend">
            <span>類型</span>
          </div>
          <el-select
            v-model.number="listQuery.deviceType"
            placeholder="請選擇"
            popper-class="type-select"
            style="width: 100px"
          >
            <el-option
              v-for="(name, id) in options.deviceType"
              :key="id"
              :value="Number(id)"
              :label="name"
            />
          </el-select>
        </div>
      </div>
      <div class="filter-item">
        <div
          class="el-input el-input--medium el-input-group el-input-group--prepend"
        >
          <div class="el-input-group__prepend">
            <span>廠商</span>
          </div>
          <el-select
            v-model.number="listQuery.contractor"
            placeholder="請選擇"
            popper-class="type-select"
            style="width: 100px"
          >
            <el-option
              v-for="(name, id) in options.guildMap"
              :key="id"
              :value="Number(id)"
              :label="name"
            />
          </el-select>
        </div>
      </div>
      <br />

      <span class="filter-item">
        <div style="font-size: 12px; color: #909399">建單日期</div>
        <time-picker
          shortcutType="year"
          :timeTabId.sync="timeTabId"
          :dateRange.sync="dateRange"
          @search="getList"
        />
      </span>
      <div class="filter-item">
        <el-input
          v-model="listQuery.filterStr"
          placeholder="請輸入"
          style="width: 300px"
        >
          <span slot="prepend">派工單號</span>
        </el-input>
      </div>

      <!-- <div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>合約</span>
					</div>
					<el-select v-model="listQuery.tenderId" class="tender-select" placeholder="請選擇" popper-class="type-select tender">
						<el-option v-for="(obj, id) in options.tenderMap" :key="id" :value="id" :label="obj.tenderName" />
					</el-select>
				</div>
			</div> -->

      <el-button
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        @click="getList()"
        >搜尋</el-button
      >
    </div>

    <h5
      v-if="
        list.length != 0 &&
        (!listQuery.filterStr || listQuery.filterStr.length == 0)
      "
    >
      查詢期間：{{ searchRange }}
    </h5>

    <el-table
      ref="multipleTable"
      empty-text="目前沒有資料"
      :data="list"
      :key="deviceTypeNow"
      border
      fit
      :header-cell-style="{ 'background-color': '#F2F6FC' }"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column width="60" align="center" fixed type="selection">
      </el-table-column>

      <el-table-column
        v-for="(value, key) in headers"
        :key="key"
        :prop="key"
        :label="value.name"
        align="center"
        :min-width="['Amount'].includes(key) ? 60 : 30"
        :sortable="value.sortable"
      >
        <template slot-scope="{ row, column }">
          <span v-if="['CaseNoArr'].includes(column.property)">
            <!-- <span v-if="row.CaseNoArr.length != 0">{{ row.CaseNoArr.join("、") }}</span> -->
            <span v-if="row.CaseNoActiveArr.length != 0">
              <span>{{ row.CaseNoActiveArr.length }}</span>
              <el-tooltip effect="dark" placement="bottom">
                <span slot="content">
                  <div
                    v-for="(caseNo, index) in row.CaseNoActiveArr"
                    :key="`${caseNo}_${index}`"
                  >
                    {{ caseNo }}
                    <span
                      v-if="
                        row.CaseIsCancelArr && row.CaseIsCancelArr[index] == 1
                      "
                      style="color: #909399"
                      >(不需施作)</span
                    >
                  </div>
                  <div v-for="caseNo in row.CaseNoInActiveArr" :key="caseNo">
                    {{ caseNo }}<span style="color: #f56c6c">(退回)</span>
                  </div>
                </span>
                <i class="icon-tooltip el-icon-warning" />
              </el-tooltip>
            </span>
            <span v-else> - </span>
          </span>
          <span v-else-if="['Amount'].includes(column.property)">
            <el-input
              v-if="row.edit && row.DateClose.length != 0"
              v-model.number="row.Amount"
              style="width: 80%"
            />
            <span v-else>{{
              row.DateClose.length != 0 ? row.Amount : "-"
            }}</span>
          </span>
          <span v-else>
            <span>{{ row[column.property] || "-" }}</span>
            <!-- <span v-if="[ 'OrderSN' ].includes(column.property)">
							<span v-if="!row.IsActive" style="color: #F56C6C">(已刪除)</span>
							<span v-else-if="row.DateClose.length != 0" style="color: #67C23A">(已完成)</span>
						</span> -->
          </span>
        </template>
      </el-table-column>

      <el-table-column
        :key="deviceTypeNow"
        label="狀態"
        min-width="30"
        align="center"
      >
        <template slot-scope="{ row }">
          <span v-if="row.DateClose.length != 0" style="color: #67c23a"
            >完成
            <!-- <i class="el-icon-check" style="color: #67C23A" /> -->
          </span>
        </template>
      </el-table-column>
    </el-table>

    <p>
      案件總數：{{ caseTotal }}
      <br />
      金額總數：{{ priceTotal }}
    </p>

    <!-- <pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" /> -->
  </div>
</template>

<script>
import moment from "moment";
import { getTenderMap, getGuildMap } from "@/api/type";
import { getJobTicketList } from "@/api/dispatch";
import TimePicker from "@/components/TimePicker";

export default {
  name: "priceManage",
  components: { TimePicker },
  data() {
    return {
      loading: false,
      showRevokeConfirm: false,
      screenWidth: window.innerWidth,
      timeTabId: 2,
      dateRange: [
        moment().startOf("month").toDate(),
        moment().endOf("day").toDate(),
      ],
      searchRange: "",
      deviceTypeNow: 1,
      contractorNow: "",
      filterNow: false,
      listQuery: {
        filter: false,
        filterStr: null,
        tenderId: null,
        deviceType: 1,
        contractor: null,
        // pageCurrent: 1,
        // pageSize: 50,
      },
      headers: {
        OrderSN: {
          name: "派工單號",
          sortable: true,
        },
        Contractor: {
          name: "廠商",
          sortable: false,
        },
        OrderType: {
          name: "維護類型",
          sortable: false,
        },
        CaseNoArr: {
          name: "案件數量",
          sortable: false,
        },
        Creater: {
          name: "建單人員",
          sortable: false,
        },
        DateAssign: {
          name: "建單時間",
          sortable: false,
        },
        DateClose: {
          name: "完工時間",
          sortable: false,
        },
        Amount: {
          name: "總金額",
          sortable: false,
        },
      },
      // total: 0,
      list: [],
      // detail: [],
      rowActive: {},
      options: {
        tenderMap: {},
        guildMap: {},
        deviceType: {
          1: "道路",
          2: "熱再生",
          3: "設施",
          4: "標線",
        },
        reasonType: {
          1: "無需施作",
          2: "退回重派",
        },
      },
      //案件總數
      caseTotal: 0,
      //金額總數
      priceTotal: 0,
      // selected: null,
    };
  },
  computed: {},
  watch: { },
  created() {
    getTenderMap().then((response) => { this.options.tenderMap = response.data.tenderMap; });
    getGuildMap().then((response) => { this.options.guildMap = response.data.guildMap; });
  },
  mounted() {},
  methods: {
    getList(showMsg = true) {
      if (!Number(this.listQuery.contractor)) {
        this.$message({
          message: "請選擇廠商",
          type: "error",
        });
      } else {
        this.loading = true;
        this.list = [];
        this.deviceTypeNow = this.listQuery.deviceType;

        let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
        let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
        this.searchRange = startDate + " - " + endDate;

        getJobTicketList({
          filter: this.listQuery.filter,
          contractor: this.listQuery.contractor,
          dispatchSN: this.listQuery.filterStr,
          deviceType: this.listQuery.deviceType,
          timeStart: startDate,
          timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD"),
        })
          .then((response) => {
            if (response.data.list.length == 0) {
              if (showMsg)
                this.$message({
                  message: "查無資料",
                  type: "error",
                });
              this.total = 0;
            } else {
              this.list = response.data.list.filter(
                (element) => element.DateClose.length != 0
              );
              // console.log(this.list);
              this.checkList = Array.from(
                { length: this.list.length },
                () => false
              );
              this.deviceTypeNow = this.listQuery.deviceType;
              this.contractorNow = this.listQuery.contractor;
              this.filterNow = this.listQuery.filter;

              this.list.forEach((l) => {
                l.Contractor = this.options.guildMap[l.Contractor];
                l.OrderType = this.options.deviceType[l.OrderType];
                l.CaseNoActiveArr = l.CaseNoActiveArr.filter(
                  (caseNo) => Number(caseNo) != 0
                );
                l.CaseNoInActiveArr = l.CaseNoInActiveArr.filter(
                  (caseNo) => Number(caseNo) != 0
                );
                l.DateAssign = this.formatDate(l.DateAssign);
                l.DateClose = this.formatDate(l.DateClose);

                this.$set(l, "edit", false);
              });
            }
            this.loading = false;
          })
          .catch((err) => (this.loading = false));
      }
    },
    formatDate(time) {
      return time ? moment(time).format("YYYY-MM-DD") : "";
    },
    //總數量計算
    handleSelectionChange(selectedOptions) {
      let tempCaseTotal = 0;
      let tempPriceTotal = 0;
      selectedOptions.forEach((elem, index) => {
        // console.log(elem, index);
        tempCaseTotal += elem.CaseNoActiveArr.length;
        tempPriceTotal += elem.Amount;
      });
      this.caseTotal = tempCaseTotal;
      this.priceTotal = tempPriceTotal;
      // console.log("案件數" + this.caseTotal);
      // console.log("金額" + this.priceTotal);
    },
  },
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.job-ticket-manage
	.filter-container
		.filter-item
			margin-right: 5px
			.el-select
				width: 110px
				.el-input__inner
					padding-left: 3px
					padding-right: 10px
					text-align: center
				.el-input__suffix
					right: 0
					// margin-right: -5px
					transform: scale(0.7)
				&.tender-select
					width: 520px
			.select-contract
				.el-select:first-child .el-input__inner
					background-color: #F5F7FA
					color: #909399
					border-right: none
					border-top-right-radius: 0
					border-bottom-right-radius: 0
					&:focus
						border-color: #DCDFE6
				.el-select:last-child .el-input__inner
					border-top-left-radius: 0
					border-bottom-left-radius: 0
					padding-left: 10px
					text-align: left
	.el-table
		.btn-action
			margin-left: 5px
			padding: 5px
	.btn-dialog
		padding: 5px 5px
</style>
