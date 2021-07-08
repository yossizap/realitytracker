class Initializable {
	dataReady = false;
	initialized = false;

	getIsDataReady() { return this.dataReady; }
	getIsInitialized() { return this.initialized; }

	// List of modules to call init() after we init. (TODO)
	getInitializationList() { return []; }

	// List of modules we depend on being initialized when we call init, otherwise init should return false
	getDependencyList() { return []; }

	
	getDependenciesReady() {
		return this.getDependencyList().every((o) => o.initialized);
	}


	// TODO
	init() {

    }

	// if dataReady is true for all, call init on init list
	runInitList() {
		if (!this.getDependencyList())
			return false;


		const initList = this.getInitializationList();
		const ready = initList.every((o) => o.getIsDataReady());
		if (!ready)
			return false;

		initList.forEach((o) => o.init());
		return true;
	}
}