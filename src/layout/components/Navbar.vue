<template>
	<div class="navbar">
		<hamburger
			id="hamburger-container"
			:is-active="sidebar.opened"
			class="hamburger-container"
			@toggleClick="toggleSideBar"
		/>

		<breadcrumb v-if="device !== 'mobile'" id="breadcrumb-container" class="breadcrumb-container" />

		<div class="right-menu">
			<template v-if="device !== 'mobile'">
				<search id="header-search" class="right-menu-item" />
				<error-log class="errLog-container right-menu-item hover-effect" />
				<screenfull id="screenfull" class="right-menu-item hover-effect" />
				<el-tooltip content="Global Size" effect="dark" placement="bottom">
					<size-select id="size-select" class="right-menu-item hover-effect" />
				</el-tooltip>
			</template>

			<el-dropdown
				class="avatar-container right-menu-item hover-effect"
				trigger="click"
				@visible-change="(val) => { this.menuOpen = val }"
			>
				<div class="avatar-wrapper">
					<!-- <el-tooltip :content="userName+' ('+uid+'子帳號)'" effect="light" :disabled="device == 'mobile' || menuOpen">
						<div slot="content">{{ userName }} ({{ uid }}{{ role.includes('servant') || role.includes('chiefServant') ? '子帳號' : '' }})</div> -->
						<span>
							<img :src="avatar + '?imageView2/1/w/80/h/80'" class="user-avatar" />
							<!-- <div v-if="role == 'servant'" class="servant"><i class="el-icon-user-solid" /></div>  -->
							<div v-if="role.includes('servant') || role.includes('chiefServant') " class="servant">❋</div>
						</span>
					<!-- </el-tooltip> -->
					<i class="el-icon-caret-bottom" />
				</div>
				<el-dropdown-menu slot="dropdown">
					<el-dropdown-item disabled>
						<span style="color: #86c0fc"><span style="font-weight: bold">{{ username }}</span>
							<!-- ({{ uid }}{{ role.includes('servant') || role.includes('chiefServant')  ? '子帳號' : '' }}) -->
						</span>
					</el-dropdown-item>
					<el-dropdown-item divided @click.native="showChangePassword">
						<span style="display: block">修改密碼</span>
					</el-dropdown-item>
					<el-dropdown-item @click.native="logout">
						<span style="display: block">登出</span>
					</el-dropdown-item>
				</el-dropdown-menu>
			</el-dropdown>
		</div>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import Breadcrumb from "@/components/Breadcrumb";
import Hamburger from "@/components/Hamburger";
import ErrorLog from "@/components/ErrorLog";
import Screenfull from "@/components/Screenfull";
import SizeSelect from "@/components/SizeSelect";
import Search from "@/components/HeaderSearch";

export default {
	components: {
		Breadcrumb,
		Hamburger,
		ErrorLog,
		Screenfull,
		SizeSelect,
		Search,
	},
	data() {
		return {
			username: localStorage.username,
			uid: localStorage.uid,
			role: this.$store.getters.roles,
			menuOpen: false,
		};
	},
	computed: {
		...mapGetters(["sidebar", "avatar", "device"]),
	},
	methods: {
		toggleSideBar() {
			this.$store.dispatch("app/toggleSideBar");
		},
		async logout() {
			await this.$store.dispatch("user/logout");
			localStorage.clear();
			sessionStorage.clear();
			this.$router.push(`/login?redirect=${this.$route.fullPath}`);
		},
		showChangePassword() {
			this.$emit("showChangePassword");
		},
		showSwitchGuild() {
			this.$emit("showSwitchGuild");
		}
	},
};
</script>

<style lang="scss" scoped>
.navbar {
	height: 50px;
	overflow: hidden;
	position: relative;
	background: #fff;
	box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

	.hamburger-container {
		line-height: 46px;
		height: 100%;
		float: left;
		cursor: pointer;
		transition: background 0.3s;
		-webkit-tap-highlight-color: transparent;

		&:hover {
			background: rgba(0, 0, 0, 0.025);
		}
	}

	.breadcrumb-container {
		float: left;
	}

	.errLog-container {
		display: inline-block;
		vertical-align: top;
	}

	.right-menu {
		// float: right;
		height: 100%;
		line-height: 50px;
		position: absolute;
		right: 0;

		&:focus {
			outline: none;
		}

		.right-menu-item {
			display: inline-block;
			padding: 0 8px;
			height: 100%;
			font-size: 18px;
			color: #5a5e66;
			vertical-align: text-bottom;

			&.hover-effect {
				cursor: pointer;
				transition: background 0.3s;

				&:hover {
					background: rgba(0, 0, 0, 0.025);
				}
			}
		}

		.avatar-container {
			margin-right: 10px;

			.avatar-wrapper {
				margin-top: 5px;
				position: relative;

				.user-avatar {
					cursor: pointer;
					width: 40px;
					height: 40px;
					border-radius: 10px;
					position: relative;
				}
				.servant {
					position: absolute;
					font-size: 14px;
					top: -15px;
					right: 2px;
					color: #E6A23C;
				}

				.el-icon-caret-bottom {
					cursor: pointer;
					position: absolute;
					right: -12px;
					top: 30px;
					font-size: 12px;
				}
			}
		}
	}
}
</style>
