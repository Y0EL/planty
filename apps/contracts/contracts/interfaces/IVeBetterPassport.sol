// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title IVeBetterPassport
/// @notice Interface for VeBetterPassport contract to determine if a wallet is a person
interface IVeBetterPassport {
  /// @notice Checks if a user is a person
  /// @param user - the user address
  /// @return person - true if the user is a person
  /// @return reason - the reason why the user is not a person
  function isPerson(address user) external view returns (bool person, string memory reason);
}