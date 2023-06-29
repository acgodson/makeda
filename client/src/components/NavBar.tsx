import React from "react";
import {
    Avatar,
    Box,
    Flex,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Text,
} from "@chakra-ui/react";
import { FiMenu } from "react-icons/fi";
import { ConnectButton } from '@rainbow-me/rainbowkit';

const NavBar = () => {


    return (
        <Flex
            zIndex={"tooltip"}
            position={"absolute"}
            as="nav"
            align="center"
            justify="space-between"
            py={4}
            px={6}
            color="white"
            bg="transparent"
            w="100%"
        >
            <Text className="logo"
            >
                Makeda
            </Text>
            <Box>
                <Menu>
                    <MenuButton
                        border={"2px solid #151515"}
                        as={Avatar}
                        size="md"
                        name="Profile"
                        src="https://robohash.org/example.png?size=200x200&set=set4" // Replace with actual image URL
                        variant="ghost"
                        colorScheme="whiteAlpha"
                    />
                    <MenuList bg="#151515">
                        <MenuItem bg="transparent">My Account:</MenuItem>
                        <MenuItem bg="transparent">{<ConnectButton />
                        }</MenuItem>

                    </MenuList>
                </Menu>
            </Box>
        </Flex>
    );
};

export default NavBar;
