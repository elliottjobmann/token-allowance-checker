import React, { useEffect } from 'react'
import { Header, Segment, Table, Placeholder } from 'semantic-ui-react'
import AddressDisplay from '../../components/AddressDisplay'
import BN from 'bn.js'
import { AddressId } from '../addressInput/AddressSlice'
import { AllowanceId, QueryStates } from './AllowancesListSlice'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'app/rootReducer'
import TokenAllowanceItem from './TokenAllowanceItem'
import { addBalanceThunk, buildBalanceId } from '../balances/BalancesSlice'
import bn2DisplayString from '@triplespeeder/bn2string'

interface TokenAllowanceItemProps {
    tokenId: AddressId
    ownerId: AddressId
    allowanceIds: Array<AllowanceId>
}

const TokenAllowancesItem = ({
    tokenId,
    ownerId,
    allowanceIds,
}: TokenAllowanceItemProps) => {
    const dispatch = useDispatch()
    const tokenContract = useSelector(
        (state: RootState) => state.tokenContracts.contractsById[tokenId]
    )
    const tokenAddress = useSelector(
        (state: RootState) => state.addresses.addressesById[tokenId]
    )
    const ownerBalance = useSelector((state: RootState) => {
        const balanceId = buildBalanceId(ownerId, tokenId)
        return state.balances.balancesById[balanceId]
    })

    // lazy-load owner balance when contract instance is available
    useEffect(() => {
        if (!ownerBalance && tokenContract?.contractInstance) {
            dispatch(addBalanceThunk(ownerId, tokenId))
        }
    }, [ownerBalance, ownerId, tokenId, tokenContract, dispatch])

    // return placeholder if contract is not yet loaded
    if (!tokenContract) {
        return (
            <Segment raised>
                <Placeholder>
                    <Placeholder.Header>
                        <Placeholder.Line />
                        <Placeholder.Line />
                    </Placeholder.Header>
                    <Placeholder.Paragraph>
                        <Placeholder.Line />
                        <Placeholder.Line />
                        <Placeholder.Line />
                    </Placeholder.Paragraph>
                </Placeholder>
            </Segment>
        )
    }

    let tokenDisplayString = tokenContract.name
    if (tokenDisplayString === '') {
        tokenDisplayString = `Unnamed ERC20`
    }
    const roundToDecimals = new BN(2)
    if (
        !ownerBalance ||
        ownerBalance.queryState === QueryStates.QUERY_STATE_RUNNING
    ) {
        tokenDisplayString += ` (current balance: loading...)`
    } else {
        const { rounded } = bn2DisplayString({
            value: ownerBalance.value,
            decimals: tokenContract.decimals,
            roundToDecimals,
        })
        tokenDisplayString += ` (current balance: ${rounded} ${tokenContract.symbol})`
    }
    const headline = <div>{tokenDisplayString}</div>

    // populate rows with one entry per allowance from allowanceIds
    const rows: Array<React.ReactNode> = []
    allowanceIds.forEach(allowanceId => {
        rows.push(
            <TokenAllowanceItem key={allowanceId} allowanceId={allowanceId} />
        )
    })

    return (
        <Segment raised>
            <Header as={'h3'}>
                {headline}
                <Header.Subheader>
                    <AddressDisplay ethAddress={tokenAddress} />
                </Header.Subheader>
            </Header>
            <Table basic={'very'} celled selectable>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Spender</Table.HeaderCell>
                        <Table.HeaderCell>Allowance</Table.HeaderCell>
                        <Table.HeaderCell>Action</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>{rows}</Table.Body>
            </Table>
        </Segment>
    )
}

export default TokenAllowancesItem
