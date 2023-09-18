<template>
  <div class="pagination-container">
    <el-pagination
      :style="device == 'mobile' ? 'width: 100%; text-align: center' : 'float: right; margin-bottom: 20px'"
      background
      :current-page.sync="pageCurrentProps"
      :page-sizes="pageSizes"
      :page-size.sync="pageSizeProps"
      :layout="device == 'mobile' ? 'prev, slot, next' : 'sizes, prev, pager, next'"
      :pager-count="5"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <span v-if="defaultPageInfo" class="pageInput">{{ pageTotal > 0 ? pageCurrentProps : 0 }} / {{ pageTotal }}</span>
      <slot v-else name="page-info" class="pageInput"/>
    </el-pagination>
    <div class="pageJump hidden-md-and-up">
      <el-button class="btn-prev" icon="el-icon-download" :disabled="pageCurrentProps == 1 || pageTotal <= 0" @click="handleCurrentChange(1)" size="mini" />
      <el-button class="btn-next" icon="el-icon-download" :disabled="pageCurrentProps == pageTotal || pageTotal <= 0" @click="handleCurrentChange(pageTotal)" size="mini" />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import 'element-ui/lib/theme-chalk/display.css';

export default {
  name: 'Pagination',
  props: {
    total: {
      required: true,
      type: Number
    },
    pageCurrent: {
      required: true,
      type: Number,
    },
    pageSize: {
      required: true,
      type: Number,
    },
    pageSizes: {
      type: Array,
      default() {
        return [ 50, 100, 150, 200 ]
      }
    },
    defaultPageInfo: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    ...mapState({
      device: (state) => state.app.device,
    }),
    pageCurrentProps: {
      get() {
        return this.pageCurrent
      },
      set(val) {
        this.$emit('update:pageCurrent', val)
      }
    },
    pageSizeProps: {
      get() {
        return this.pageSize
      },
      set(val) {
        this.$emit('update:pageSize', val)
      }
    },
    pageTotal() {
      return Math.ceil(this.total / this.pageSize)
    }
  },
  methods: {
    handleSizeChange(val) {
      this.pageSizeProps = val;
      this.pageCurrentProps = 1;
      this.$emit('pagination');
    },
    handleCurrentChange(val) {
      this.pageCurrentProps =  val;
      this.$emit('pagination');
    }
  }
}
</script>

<style lang="sass">
@media screen and (max-width: 991px)
  .pagination-container
    position: fixed
    width: 100%
    bottom: 0
    left: 0
    i
      font-size: 16px
    .el-pagination
      width: 100%
      // position: fixed
      // bottom: 0
      // left: 0
      padding: 10px 0
      background-color: rgba(#fff, 0.8)
      border: 1px solid #EBEEF5
      .btn-prev, .btn-next
        width: 15%
        background-color: transparent
      .pageInput
        font-size: 16px
        width: 25%
        .pageBorder
          width: 50px
          margin-right: 10px
          .el-input__inner
            padding: 0
            height: 30px
    .pageJump
      position: absolute
      pointer-events: none
      width: 100%
      height: 100%
      bottom: 0
      left: 0
      padding: 10px 0
      .btn-prev, .btn-next
        width: 15%
        height: 30px
        pointer-events: auto
        background-color: transparent
        border: none
      .btn-prev 
        position: absolute
        left: 5%
        .el-icon-download
          transform: rotate(90deg)
      .btn-next 
        position: absolute
        right: 5%
        .el-icon-download
          transform: rotate(-90deg)
</style>
