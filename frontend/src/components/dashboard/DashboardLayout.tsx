import React, { useState } from 'react';
import { Box, Flex, useBreakpointValue } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { User } from '../../services/auth';

interface DashboardLayoutProps {
    sidebar: React.ReactNode;
    children: React.ReactNode;
    navbarRightContent?: React.ReactNode;
    navbarTitle?: string;
    user?: User;
    onChangePasswordClick?: () => void;
    onLogoutClick?: () => void;
}

const MotionBox = motion(Box);

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    sidebar,
    children,
    navbarRightContent,
    navbarTitle,
    user,
    onChangePasswordClick,
    onLogoutClick,
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

    // On mobile, sidebar should be an overlay; on desktop, it should push content
    const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;

    const sidebarWidth = 300;

    const handleToggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    return (
        <Flex direction="column" h="100vh" overflow="hidden">
            {/* Navbar */}
            <Navbar
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={handleToggleSidebar}
                title={navbarTitle}
                rightContent={navbarRightContent}
                user={user}
                onChangePasswordClick={onChangePasswordClick}
                onLogoutClick={onLogoutClick}
            />

            {/* Main content area with sidebar */}
            <Flex flex={1} position="relative" overflow="hidden">
                {/* Sidebar - Desktop: slides in/out, Mobile: overlay */}
                {isMobile ? (
                    // Mobile: Absolute positioned overlay
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <>
                                <MotionBox
                                    key="mobile-sidebar"
                                    initial={{ x: -sidebarWidth }}
                                    animate={{ x: 0 }}
                                    exit={{ x: -sidebarWidth }}
                                    transition={{
                                        duration: 0.3,
                                        ease: [0.4, 0, 0.2, 1]
                                    }}
                                    position="absolute"
                                    left={0}
                                    top={0}
                                    w={`${sidebarWidth}px`}
                                    h="full"
                                    zIndex={999}
                                    boxShadow="2xl"
                                >
                                    {sidebar}
                                </MotionBox>
                                <MotionBox
                                    key="mobile-overlay"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    position="absolute"
                                    top={0}
                                    left={0}
                                    right={0}
                                    bottom={0}
                                    bg="blackAlpha.600"
                                    zIndex={998}
                                    onClick={handleToggleSidebar}
                                />
                            </>
                        )}
                    </AnimatePresence>
                ) : (
                    // Desktop: Width-based animation
                    <MotionBox
                        initial={false}
                        animate={{
                            width: isSidebarOpen ? sidebarWidth : 0
                        }}
                        transition={{
                            duration: 0.3,
                            ease: [0.4, 0, 0.2, 1]
                        }}
                        position="relative"
                        h="full"
                        overflow="hidden"
                    >
                        <Box w={`${sidebarWidth}px`} h="full">
                            {sidebar}
                        </Box>
                    </MotionBox>
                )}

                {/* Main content */}
                <Box flex={1} overflowY="auto">
                    {children}
                </Box>
            </Flex>
        </Flex>
    );
};

export default DashboardLayout;
