const state = {
	blockGeo_bell: {},
	blockGeo_nco: {}
}

const mutations = {
	SET_BLOCK_BELL: (state, { tenderRound, JSONString }) => {
		state.blockGeo_bell[tenderRound] = JSONString;
	},
	SET_BLOCK_NCO: (state, { tenderRound, JSONString }) => {
		state.blockGeo_nco[tenderRound] = JSONString;
	},
	RESET_BLOCK: (state) => {
		state.blockGeo = {};
	}
}

const actions = {
	setGeoJSON_bell({ commit }, { tenderRound, JSONString }) {
		commit('SET_BLOCK_BELL', { tenderRound, JSONString });
	},
	setGeoJSON_nco({ commit }, { tenderRound, JSONString }) {
		commit('SET_BLOCK_NCO', { tenderRound, JSONString });
	},
	resetGeoJSON({ commit }) {
		commit('RESET_BLOCK', {});
	},
}

export default {
	namespaced: true,
	state,
	mutations,
	actions
}
