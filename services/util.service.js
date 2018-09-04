const UtilService = {
    // TODO need to add these fields 
    addProps(paramObject) {
        const result = Object.assign({}, paramObject);
        result.insertDate = new Date();
        result.updateDate = new Date();
        return result;
    }
}
export default UtilService;