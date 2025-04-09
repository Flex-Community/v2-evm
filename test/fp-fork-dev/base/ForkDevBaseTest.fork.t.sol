pragma solidity ^0.8.18;

import {DynamicForkBaseTest} from "../../fp-fork/bases/DynamicForkBaseTest.sol";

contract ForkDevBaseTest is DynamicForkBaseTest {

    function isForkDev() internal view returns (bool) {
        return bytes(vm.envOr("FORK_DEV_TEST", string(""))).length > 0;
    }


    modifier onlyForkDev() {
        vm.skip(!isForkSupported || !isForkDev(), "Only with Fork Dev");
        _;
    }

    function setUp() public virtual override {
        super.setUp();
    }

    


}
