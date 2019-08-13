import React, { useMemo } from 'react'
import styled from 'styled-components/macro'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import { useDataloader } from '../bootstrap/dataloader'

import TitledListCard from './titled-list-card'
import ListItem from './list-item'

const StyledDiv = styled.div`
  margin-top: 50px;
`

const OngoingCasesCard = ({}) => {
  const { drizzle, useCacheCall, useCacheEvents } = useDrizzle()
  const getMetaEvidence = useDataloader.getMetaEvidence()
  const drizzleState = useDrizzleState(drizzleState => ({
    account: drizzleState.accounts[0]
  }))

  const draws = useCacheEvents(
    'KlerosLiquid',
    'Draw',
    useMemo(
      () => ({
        filter: { _address: drizzleState.account },
        fromBlock: process.env.REACT_APP_KLEROS_LIQUID_BLOCK_NUMBER
      }),
      [drizzleState.account]
    )
  )
  const disputes = useCacheCall(['KlerosLiquid'], call =>
    draws
      ? Object.values(
          draws.reduce((acc, d) => {
            acc[d.returnValues._disputeID] = d
            return acc
          }, {})
        ).reduce(
          (acc, d) => {
            const dispute = call(
              'KlerosLiquid',
              'disputes',
              d.returnValues._disputeID
            )
            if (dispute)
              if (dispute.period === '1' || dispute.period === '2') {
                const dispute2 = call(
                  'KlerosLiquid',
                  'getDispute',
                  d.returnValues._disputeID
                )
                if (dispute2) {
                  const metaEvidence = getMetaEvidence(
                    dispute2.arbitrated,
                    drizzle.contracts.KlerosLiquid.address,
                    d.returnValues._disputeID
                  )

                  if (
                    Number(d.returnValues._appeal) ===
                    dispute2.votesLengths.length - 1
                  ) {
                    const vote = call(
                      'KlerosLiquid',
                      'getVote',
                      d.returnValues._disputeID,
                      d.returnValues._appeal,
                      d.returnValues._voteID
                    )
                    if (vote)
                      acc[vote.voted ? 'active' : 'votePending'].push(
                        {
                          ...metaEvidence,
                          ID: d.returnValues._disputeID
                        }
                      )
                    else acc.loading = true
                  } else acc.active.push(
                    {
                      ...metaEvidence,
                      ID: d.returnValues._disputeID
                    }
                  )
                }

                else acc.loading = true
              } else {
                const metaEvidence = getMetaEvidence(
                  dispute.arbitrated,
                  drizzle.contracts.KlerosLiquid.address,
                  d.returnValues._disputeID
                )

                if (dispute.period === '4')
                  acc.executed.push(
                    {
                      ...metaEvidence,
                      ID: d.returnValues._disputeID
                    }
                  )
                else
                  acc.active.push(
                    {
                      ...metaEvidence,
                      ID: d.returnValues._disputeID
                    }
                  )
              }
            else acc.loading = true
            return acc
          },
          { active: [], executed: [], loading: false, votePending: [] }
        )
      : { active: [], executed: [], loading: true, votePending: [] }
  )

  return (
    <StyledDiv>
      <TitledListCard
        prefix={"IMG"}
        title={"Ongoing Cases"}
      > {
        (disputes.votePending.length === 0 && disputes.active.length === 0) ? (
          <ListItem key='Ongoing-Cases-None'>You have no Ongoing Cases</ListItem>
        ) : (
          <div>Blah</div>
        )
      }
      </TitledListCard>
    </ StyledDiv>
  )
}

export default OngoingCasesCard
