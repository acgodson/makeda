const deployERC20 = async () => {
  const ERC20 = await ethers.getContractFactory("TestERC20"); 
  const erc20 = await ERC20.deploy("Test", "TST");
  await erc20.deployed();
  console.log(erc20.address); 
};
deployERC20();